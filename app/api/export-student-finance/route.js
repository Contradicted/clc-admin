import { exportStudentFinanceData } from "@/lib/export";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseTitle = searchParams.get("courseTitle");
    const campus = searchParams.get("campus");
    const commencement = searchParams.get("commencement");

    if (!courseTitle || !campus || !commencement) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const csvData = await exportStudentFinanceData(courseTitle, campus, commencement);

    if (!csvData) {
      return NextResponse.json(
        { error: "No matching applications found" },
        { status: 404 }
      );
    }

    // Set headers for CSV download
    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set(
      "Content-Disposition",
      `attachment; filename="student_finance_${new Date().toISOString().split("T")[0]}.csv"`
    );

    return new NextResponse(csvData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[EXPORT_STUDENT_FINANCE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to export student finance data" },
      { status: 500 }
    );
  }
}
