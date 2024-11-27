import { exportStudentFinanceData } from "@/lib/export";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const courseTitle = searchParams.get("courseTitle");
    const campus = searchParams.get("campus");
    const commencement = searchParams.get("commencement");
    const slcStatus = searchParams.get("slcStatus");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!courseTitle || !campus || !commencement) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const csvContent = await exportStudentFinanceData(
      courseTitle,
      campus,
      commencement,
      slcStatus,
      month,
      year
    );

    if (!csvContent) {
      return NextResponse.json(
        { error: "No applications found matching the criteria" },
        { status: 404 }
      );
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=student_finance_${new Date()
          .toISOString()
          .split("T")[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("[EXPORT_STUDENT_FINANCE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}
