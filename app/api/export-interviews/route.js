import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exportInterviews } from "@/lib/export";

export async function POST(req) {
  try {
    const { courseTitle, campus, commencement, status, dateRange } =
      await req.json();

    console.log("Export request received with filters:", {
      courseTitle,
      campus,
      commencement,
      status,
      dateRange,
    });

    // First, fetch all interviews with their application data
    const allInterviews = await db.applicationInterview.findMany({
      include: {
        application: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`Total interviews fetched from database: ${allInterviews.length}`);

    // Then filter them in memory, similar to how the frontend does it
    const filteredInterviews = allInterviews.filter((interview) => {
      const application = interview.application;
      if (!application) return false;
      
      // Filter by course title
      if (courseTitle && application.courseTitle !== courseTitle) return false;
      
      // Filter by campus
      if (campus && application.campus !== campus) return false;
      
      // Filter by commencement
      if (commencement && application.commencement !== commencement) return false;
      
      // Filter by status
      if (status && status !== "all") {
        // Handle null/undefined status in interviews
        if (interview.status === null || interview.status === undefined) {
          return false;
        }
        
        if (status === "pass" && interview.status !== "pass") return false;
        if (status === "fail" && interview.status !== "fail") return false;
      }

      // Filter by date range if specified
      if (dateRange && dateRange.from) {
        const interviewDate = new Date(interview.date);
        const from = new Date(dateRange.from);
        const to = dateRange.to ? new Date(dateRange.to) : new Date();

        // Set time to beginning/end of day for accurate comparison
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        if (interviewDate < from || interviewDate > to) return false;
      }

      return true;
    });

    console.log(`Found ${filteredInterviews.length} interviews matching the criteria`);

    // Use the exportInterviews function with proper styling
    const workbook = await exportInterviews(filteredInterviews, {
      courseTitle,
      campus,
      commencement,
      status,
      dateRange,
    });

    // Generate the Excel file
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="interviews_export.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting interviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export interviews" },
      { status: 500 }
    );
  }
}
