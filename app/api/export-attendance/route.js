import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAttendanceSheet } from "@/lib/export";
import { format } from "date-fns";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");
    const commencement = searchParams.get("commencement");
    const date = searchParams.get("date");
    const courseTitle = searchParams.get("courseTitle");

    if (!campus || !commencement || !date || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Fetch students enrolled in the course from the database
    const students = await db.enrolledStudent.findMany({
      where: {
        application: {
          courseTitle: courseTitle,
          campus: campus,
          commencement: commencement,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        office365Email: true
      },
      orderBy: [
        { firstName: 'asc' },  // Primary sort by first name
        { lastName: 'asc' }    // Secondary sort by last name
      ]
    });

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: "No students found for this course" },
        { status: 404 }
      );
    }

    const buffer = await generateAttendanceSheet(students, {
      courseTitle,
      campus,
      commencement,
      date: new Date(date),
    });

    if (!buffer) {
      throw new Error("Failed to generate attendance sheet");
    }

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attendance-${format(new Date(date), "yyyy-MM-dd")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating attendance sheet:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate attendance sheet" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request) {
  try {
    const { courseId, campus, commencement, date } = await request.json();

    // Fetch students enrolled in the course from the database
    const students = await db.student.findMany({
      where: {
        enrollments: {
          some: {
            courseId: parseInt(courseId),
            // You can add additional filters if needed
            // campus: campus,
            // commencement: commencement,
          }
        },
        // Filter for active students only
        status: "ACTIVE"
      },
      select: {
        clcId: true,
        firstName: true,
        lastName: true
      },
      orderBy: [
        { firstName: 'asc' },  // Primary sort by first name
        { lastName: 'asc' }    // Secondary sort by last name
      ]
    });

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: "No students found for this course" },
        { status: 404 }
      );
    }

    const buffer = await generateAttendanceSheet(students, {
      courseTitle: "Higher National Certificate (HNC) in Business (level 4)",
      campus,
      commencement,
      date: new Date(date),
    });

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attendance-${format(new Date(date), "yyyy-MM-dd")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating attendance sheet:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate attendance sheet" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
