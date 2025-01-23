export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { exportStudentData } from "@/lib/export";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const courseTitle = url.searchParams.get("courseTitle");
    const campus = url.searchParams.get("campus");
    const commencement = url.searchParams.get("commencement");
    const enrollmentStatus = url.searchParams.get("enrollmentStatus");

    // console.log("Received request with parameters:", {
    //   courseTitle,
    //   campus,
    //   commencement,
    //   enrollmentStatus,
    // });

    // Get all applications matching the criteria
    const applications = await db.application.findMany({
      where: {
        courseTitle,
        campus,
        commencement,
        ...(enrollmentStatus === "enrolled" && {
          status: "Enrolled",
          enrolledStudent: {
            isNot: null,
          },
        }),
        ...(enrollmentStatus === "not_enrolled" && {
          OR: [
            { status: { not: "Enrolled" } },
            {
              AND: [{ status: "Enrolled" }, { enrolledStudent: null }],
            },
          ],
        }),
      },
      orderBy: {
        firstName: "asc",
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
        dateOfBirth: true,
        courseTitle: true,
        campus: true,
        commencement: true,
        emergency_contact_name: true,
        emergency_contact_no: true,
        recruitment_agent: true,
        status: true,
        enrolledStudent: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log("Found applications:", applications.length);

    // Return early if no applications found
    if (applications.length === 0) {
      return NextResponse.json(
        { error: "No applications found matching the criteria" },
        { status: 404 }
      );
    }

    const result = await exportStudentData(applications, {
      courseTitle,
      campus,
      commencement,
      enrollmentStatus,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const csvContent = result;

    // Format filename
    const formattedCourseTitle = courseTitle.replace(/[^a-zA-Z0-9]/g, "_");
    const formattedCommencement = commencement.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${formattedCourseTitle}_${campus}_${formattedCommencement}_${enrollmentStatus}_details_${new Date().toISOString().split("T")[0]}.csv`;

    // Create response with CSV content
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
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
