import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Register a device to receive push notifications for a pass
 * This endpoint is called by Apple Wallet when a pass is added
 */
export async function POST(
  request,
  { params: { passTypeIdentifier, deviceLibraryIdentifier, serialNumber } }
) {
  try {
    console.log(
      `[DEVICE_REGISTER] Registering device ${deviceLibraryIdentifier} for pass ${serialNumber}`
    );

    // Get the push token from the request body
    const data = await request.json();
    const pushToken = data.pushToken;

    if (!pushToken) {
      console.error("[DEVICE_REGISTER] No push token provided");
      return new NextResponse("Push token is required", { status: 400 });
    }

    // Verify the pass exists
    const student = await db.enrolledStudent.findUnique({
      where: { id: serialNumber },
    });

    if (!student) {
      console.error(`[DEVICE_REGISTER] Pass not found: ${serialNumber}`);
      return new NextResponse("Pass not found", { status: 404 });
    }

    // Create or update the device registration
    const registration = await db.passRegistration.upsert({
      where: {
        deviceId_serialNumber: {
          deviceId: deviceLibraryIdentifier,
          serialNumber: serialNumber,
        },
      },
      update: {
        pushToken: pushToken,
      },
      create: {
        deviceId: deviceLibraryIdentifier,
        pushToken: pushToken,
        serialNumber: serialNumber,
      },
    });

    console.log(
      `[DEVICE_REGISTER] Successfully registered device ${deviceLibraryIdentifier} for pass ${serialNumber}`
    );
    return new NextResponse("Registration successful", { status: 200 });
  } catch (error) {
    console.error("[DEVICE_REGISTER_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

/**
 * Unregister a device from receiving push notifications for a pass
 * This endpoint is called by Apple Wallet when a pass is removed
 */
export async function DELETE(
  request,
  { params: { passTypeIdentifier, deviceLibraryIdentifier, serialNumber } }
) {
  try {
    console.log(
      `[DEVICE_UNREGISTER] Unregistering device ${deviceLibraryIdentifier} for pass ${serialNumber}`
    );

    // Delete the registration
    await db.passRegistration.deleteMany({
      where: {
        deviceId: deviceLibraryIdentifier,
        serialNumber: serialNumber,
      },
    });

    console.log(
      `[DEVICE_UNREGISTER] Successfully unregistered device ${deviceLibraryIdentifier} for pass ${serialNumber}`
    );
    return new NextResponse("Unregistration successful", { status: 200 });
  } catch (error) {
    console.error("[DEVICE_UNREGISTER_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
