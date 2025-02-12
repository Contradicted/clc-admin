import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FireTextService } from "@/lib/firetext";

export async function POST(req) {
  try {
    const { studentIds, message } = await req.json();

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "No students selected" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get students with their phone numbers
    const students = await db.enrolledStudent.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      include: {
        application: {
          select: {
            mobileNo: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { error: "No valid students found" },
        { status: 400 }
      );
    }

    // Validate phone numbers
    const invalidStudents = students.filter(
      (student) => !student.application?.mobileNo?.match(/^\+?[\d\s-]+$/)
    );

    if (invalidStudents.length > 0) {
      return NextResponse.json({
        error: "Some students have invalid phone numbers",
        invalidStudents: invalidStudents.map((student) => ({
          id: student.id,
          name: `${student.application?.user?.firstName} ${student.application?.user?.lastName}`,
          phone: student.application?.mobileNo,
        })),
      }, { status: 400 });
    }

    // Initialize counters and results
    let sent = 0;
    let failed = 0;
    const results = [];
    const now = new Date();

    // Initialize FireText with API key
    if (!process.env.FIRETEXT_API_KEY) {
      throw new Error("FIRETEXT_API_KEY environment variable is not set");
    }
    const firetext = new FireTextService(process.env.FIRETEXT_API_KEY);

    // Send messages
    const sendResults = await Promise.allSettled(
      students.map(async (student) => {
        try {
          const phoneNumber = student.application?.mobileNo;
          if (!phoneNumber) {
            failed++;
            // Create failed message record
            await db.message.create({
              data: {
                studentId: student.id,
                content: message.trim(),
                status: "failed",
                error: "No phone number",
                sentAt: now,
              },
            });
            results.push({
              studentId: student.id,
              name: `${student.application?.user?.firstName} ${student.application?.user?.lastName}`,
              status: "failed",
              error: "No phone number",
            });
            return;
          }

          // Try to send the message
          const smsResult = await firetext.sendSMS(phoneNumber, message.trim());
          
          if (smsResult.success) {
            // Record successful message
            await db.message.create({
              data: {
                studentId: student.id,
                content: message.trim(),
                status: "sent",
                sentAt: now,
              },
            });

            sent++;
            results.push({
              studentId: student.id,
              name: `${student.application?.user?.firstName} ${student.application?.user?.lastName}`,
              status: "sent",
              phone: phoneNumber,
              response: smsResult.response,
            });
          } else {
            // Record failed message
            await db.message.create({
              data: {
                studentId: student.id,
                content: message.trim(),
                status: "failed",
                error: smsResult.response,
                sentAt: now,
              },
            });

            failed++;
            results.push({
              studentId: student.id,
              name: `${student.application?.user?.firstName} ${student.application?.user?.lastName}`,
              status: "failed",
              error: smsResult.response,
            });
          }
        } catch (error) {
          console.error(
            `Failed to send message to student ${student.id}:`,
            error
          );
          failed++;
          results.push({
            studentId: student.id,
            name: `${student.application?.user?.firstName} ${student.application?.user?.lastName}`,
            status: "failed",
            error: error.message,
          });
        }
      })
    );

    return NextResponse.json({
      sent,
      failed,
      total: students.length,
      results: results,
    });
  } catch (error) {
    console.error("Error sending messages:", error);
    return NextResponse.json(
      { error: "Failed to send messages", details: error.message },
      { status: 500 }
    );
  }
}
