import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !["Admin", "Staff"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const { userId, subject, content, templateId } = await req.json();

    // Validate required fields
    if (!userId || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create letter record
    const letter = await db.letter.create({
      data: {
        subject,
        content,
        userId,
        sentBy: session.user.id,
        sentAt: new Date(),
        status: "sent",
        templateId: templateId || null,
      },
    });

    // In a real-world scenario, here you would:
    // 1. Generate a PDF from the letter content
    // 2. Send the letter via email or a postal service API
    // 3. Update the letter status based on the delivery result

    return NextResponse.json({ success: true, letter });
  } catch (error) {
    console.error("Error sending letter:", error);
    return NextResponse.json(
      { error: "Failed to send letter" },
      { status: 500 }
    );
  }
}
