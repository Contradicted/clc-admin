import { exportStudentData } from "@/lib/export";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const courseTitle = url.searchParams.get('courseTitle');
    const campus = url.searchParams.get('campus');
    const commencement = url.searchParams.get('commencement');

    console.log("Received request with parameters:", {
      courseTitle,
      campus,
      commencement,
    });

    // Get all applications matching the criteria
    const applications = await db.application.findMany({
      where: {
        courseTitle,
        campus,
        commencement,
      },
      select: {
        title: true,
        firstName: true,
        lastName: true,
        gender: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
        email: true,
        mobileNo: true,
        emergency_contact_name: true,
        emergency_contact_no: true,
      },
    });

    console.log("Found applications:", applications.length);

    const { csvContent, error } = await exportStudentData(applications, {
      courseTitle,
      campus,
      commencement,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Create response with CSV content
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="student_data_${new Date().toISOString().split("T")[0]}.csv"`
    );

    return response;
  } catch (error) {
    console.error("[EXPORT_STUDENT_DATA_API_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to export student data" },
      { status: 500 }
    );
  }
}
