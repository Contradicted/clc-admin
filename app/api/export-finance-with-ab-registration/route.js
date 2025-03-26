export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exportFinanceWithABRegistration } from "@/lib/export";
import { Workbook } from "exceljs";

async function getApplicationsWithABRegistration({
  courseTitle,
  campus,
  commencement,
  slcStatus,
  month,
  year,
  fromDate,
  toDate,
}) {
  const dateRange = fromDate
    ? { from: fromDate, to: toDate || fromDate }
    : undefined;

  return await db.application.findMany({
    where: {
      courseTitle: courseTitle || undefined,
      campus: campus || undefined,
      commencement: commencement || undefined,
      ab_registration_no: {
        not: null,
      },
      paymentPlan: {
        slcStatus: slcStatus || undefined,
      },
    },
    select: {
      firstName: true,
      lastName: true,
      title: true,
      dateOfBirth: true,
      email: true,
      mobileNo: true,
      courseTitle: true,
      campus: true,
      commencement: true,
      recruitment_agent: true,
      ab_registration_no: true,
      paymentPlan: {
        select: {
          crn: true,
          ssn: true,
          slcStatus: true,
          expectedPayments: true,
          tuitionFeeAmount: true,
          maintenanceLoanAmount: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function GET(request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const courseTitle = searchParams.get("courseTitle");
    const campus = searchParams.get("campus");
    const commencement = searchParams.get("commencement");
    const slcStatus = searchParams.get("slcStatus");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Get all applications based on filter criteria
    const applications = await getApplicationsWithABRegistration({
      courseTitle,
      campus,
      commencement,
      slcStatus,
      month,
      year,
      fromDate,
      toDate,
    });

    if (applications.length === 0) {
      return new NextResponse("No data found", { status: 404 });
    }

    // Create Excel workbook and worksheet
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Finance with AB Registration");

    try {
      // Call the export function with the workbook and worksheet
      await exportFinanceWithABRegistration(workbook, worksheet, applications, {
        courseTitle,
        campus,
        commencement,
        slcStatus,
        month,
        year,
        dateRange: fromDate
          ? { from: fromDate, to: toDate || fromDate }
          : undefined,
      });
    } catch (error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Prepare filename for the Excel download
    const filename = `finance_ab_registration_${
      courseTitle ? courseTitle.replace(/[^a-zA-Z0-9]/g, "_") : "all"
    }_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Return the Excel buffer as a response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[EXPORT_FINANCE_AB_REGISTRATION_ERROR]", error);
    return new NextResponse("Error exporting data", { status: 500 });
  }
}