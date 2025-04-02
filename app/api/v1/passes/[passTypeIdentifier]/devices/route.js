import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Get all passes registered for a device
 * This endpoint is called by Apple Wallet to get all passes registered for a device
 */
export async function GET(
  request,
  { params: { passTypeIdentifier, deviceLibraryIdentifier } }
) {
  try {
    console.log(
      `[GET_REGISTRATIONS] Getting registrations for device ${deviceLibraryIdentifier}`
    );

    // Find all registrations for this device
    const registrations = await db.passRegistration.findMany({
      where: {
        deviceId: deviceLibraryIdentifier,
      },
      select: {
        serialNumber: true,
      },
    });

    // Format the response as required by Apple
    const serialNumbers = registrations.map((reg) => reg.serialNumber);

    console.log(
      `[GET_REGISTRATIONS] Found ${serialNumbers.length} registrations for device ${deviceLibraryIdentifier}`
    );

    // Return the serial numbers in the format expected by Apple
    return NextResponse.json({ serialNumbers });
  } catch (error) {
    console.error("[GET_REGISTRATIONS_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}