import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");
    const commencement = searchParams.get("commencement");
    const courseTitle = searchParams.get("courseTitle");

    if (!campus || !commencement || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Count students enrolled in the course from the database
    const studentCount = await db.enrolledStudent.count({
      where: {
        application: {
          courseTitle: courseTitle,
          campus: campus,
          commencement: commencement,
        },
      },
    });

    // Return whether students exist for this course and the count
    return NextResponse.json({
      hasStudents: studentCount > 0,
      count: studentCount,
    });
  } catch (error) {
    console.error("Error checking student availability:", error);
    return NextResponse.json(
      { error: "Failed to check student availability" },
      { status: 500 }
    );
  }
}
