export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { exportApplicationData } from "@/lib/export";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const courseTitle = url.searchParams.get('courseTitle');
    const campus = url.searchParams.get('campus');
    const commencement = url.searchParams.get('commencement');

    // console.log("Received request with parameters:", {
    //   courseTitle,
    //   campus,
    //   commencement,
    // });

    // Get all applications matching the criteria
    const applications = await db.application.findMany({
      where: {
        courseTitle,
        campus,
        commencement,
      },
      orderBy: {
        firstName: 'asc',
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
      },
    });

    console.log("Found applications:", applications.length);

    const { csvContent, error } = await exportApplicationData(applications, {
      courseTitle,
      campus,
      commencement,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Format filename
    const formattedCourseTitle = courseTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedCommencement = commencement.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${formattedCourseTitle}_${campus}_${formattedCommencement}_details_${new Date().toISOString().split('T')[0]}.csv`;

    // Create response with CSV content
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    return response;
  } catch (error) {
    console.error("[EXPORT_APPLICATION_DATA_API_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to export application data" },
      { status: 500 }
    );
  }
}
