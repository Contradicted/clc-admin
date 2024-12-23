import { exportStudentFinanceData, exportStudentFinanceByDateRange } from "@/lib/export";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const { exportMode, dateRange, ...filters } = data;

    let csvContent;
    if (exportMode === "date-range" && dateRange) {
      csvContent = await exportStudentFinanceByDateRange(dateRange);
    } else {
      // Original export mode with filters
      csvContent = await exportStudentFinanceData(
        filters.courseTitle,
        filters.campus,
        filters.commencement,
        filters.slcStatus,
        filters.month,
        filters.year
      );
    }

    if (!csvContent) {
      return new NextResponse("No data found", { status: 404 });
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="student-finance.csv"',
      },
    });
  } catch (error) {
    console.error("[EXPORT_STUDENT_FINANCE_ERROR]", error);
    return new NextResponse("Error exporting data", { status: 500 });
  }
}
