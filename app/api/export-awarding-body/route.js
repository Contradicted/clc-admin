export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { exportAwardingBodyToExcel } from "@/lib/export";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseTitle = searchParams.get("courseTitle");
    const campus = searchParams.get("campus");
    const commencement = searchParams.get("commencement");

    // First get the course to get the awarding body
    const course = await db.course.findFirst({
      where: { name: courseTitle },
      select: { awarding_body: true }
    });

    // Get applications based on filters
    const applications = await db.application.findMany({
      where: {
        courseTitle,
        campus,
        commencement,
      },
      select: {
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        ab_registration_no: true,
        ab_registration_date: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
    });

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "No records found matching the selected criteria" },
        { status: 404 }
      );
    }

    const buffer = await exportAwardingBodyToExcel(applications, {
      courseTitle,
      campus,
      commencement,
      awardingBody: course?.awarding_body || 'N/A'
    });

    if (buffer.error) {
      return NextResponse.json({ error: buffer.error }, { status: 500 });
    }

    const filename = `${courseTitle || "All"}_${campus || "All"}_${
      commencement || "All"
    }_awarding_body_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[EXPORT_AWARDING_BODY_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}
