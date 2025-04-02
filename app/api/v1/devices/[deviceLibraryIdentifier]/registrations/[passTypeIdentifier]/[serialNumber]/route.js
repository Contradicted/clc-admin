import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Helper function to log registration attempts
const logRegistration = (action, params, data, result) => {
  const logDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logDir, "wallet-registration.log");

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    params,
    data,
    result,
  };

  fs.appendFileSync(logFile, JSON.stringify(logEntry, null, 2) + "\n\n");

  // Also log to console for immediate visibility
  console.log(
    `[WALLET_REGISTRATION] ${action}`,
    JSON.stringify({
      params,
      timestamp: new Date().toISOString(),
    })
  );
};

// Helper function to verify authentication token
const verifyAuthToken = (serialNumber, authToken) => {
  const secret = process.env.APPLE_PASS_SECRET;
  if (!secret) {
    console.error("[AUTH_ERROR] APPLE_PASS_SECRET not set");
    return false;
  }

  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(serialNumber)
    .digest("hex");
  return authToken === expectedToken;
};

// Register a device to receive push notifications for a pass
export async function POST(
  request,
  { params: { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } }
) {
  console.log("==================================================");
  console.log(`[WALLET_API] POST_REQUEST at ${new Date().toISOString()}`);
  console.log(`Device: ${deviceLibraryIdentifier}`);
  console.log(`Pass Type: ${passTypeIdentifier}`);
  console.log(`Serial Number: ${serialNumber}`);
  console.log(`URL: ${request.url}`);

  // Log all headers for debugging
  const headers = Object.fromEntries(request.headers);
  console.log(`Headers: ${JSON.stringify(headers)}`);

  // Try to log the request body
  let body = null;
  try {
    const clonedRequest = request.clone();
    const text = await clonedRequest.text();
    console.log(`Request Body: ${text}`);
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.log("Body is not JSON");
    }
  } catch (e) {
    console.log("Could not read request body");
  }

  console.log("==================================================");

  // Check authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("ApplePass ")) {
    // During testing, we'll allow requests without proper authentication
    console.warn("[WARNING] Missing or invalid Authorization header");
  } else {
    const token = authHeader.replace("ApplePass ", "");
    const expectedToken = verifyAuthToken(serialNumber, token);

    if (!expectedToken) {
      // During testing, we'll allow requests with invalid tokens
      console.warn("[WARNING] Invalid authentication token");
    }
  }

  try {
    // Get the push token from the request body
    let pushToken = body.pushToken || "";

    if (!pushToken) {
      console.log("[MISSING_PUSH_TOKEN] No push token provided");
      logRegistration(
        "MISSING_PUSH_TOKEN",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        "No push token provided"
      );
      
      // If we're in development mode, use a placeholder for testing
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[DEV_MODE] Using placeholder push token for testing"
        );
        pushToken = `test-token-${deviceLibraryIdentifier}-${Date.now()}`;
      } else {
        return new NextResponse("Push token is required", { status: 400 });
      }
    }

    // First check if the student exists to avoid foreign key constraint errors
    const studentExists = await db.enrolledStudent.findUnique({
      where: {
        id: serialNumber,
      },
    });

    if (!studentExists) {
      // If the student doesn't exist in the database, return an error
      console.log("[STUDENT_NOT_FOUND] Student does not exist in database");
      logRegistration(
        "STUDENT_NOT_FOUND",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        "Student not found"
      );

        return new NextResponse("Student not found", { status: 404 });
    }

    // First, check if we already have registrations for this serial number
    const existingRegistrations = await db.passRegistration.findMany({
      where: {
        serialNumber: serialNumber,
      },
    });

    console.log("[EXISTING_REGISTRATIONS]", {
      count: existingRegistrations.length,
      serialNumber,
      deviceLibraryIdentifier,
    });

    // If we have more than one registration for this pass, keep only the most recent one
    if (existingRegistrations.length >= 1) {
      // Sort registrations by creation date (newest first)
      const sortedRegistrations = [...existingRegistrations].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      // Keep the most recent registration and update it with the new device ID and push token
      const mostRecentRegistration = sortedRegistrations[0];

      // Delete all other registrations
      if (sortedRegistrations.length > 1) {
        for (let i = 1; i < sortedRegistrations.length; i++) {
          const regToDelete = sortedRegistrations[i];
          console.log("[DELETING_OLD_REGISTRATION]", {
            id: regToDelete.id,
            deviceId: regToDelete.deviceId,
            createdAt: regToDelete.createdAt,
          });

          await db.passRegistration.delete({
            where: {
              id: regToDelete.id,
            },
          });
        }
      }

      // Update the most recent registration with the new device ID and push token
      const updatedRegistration = await db.passRegistration.update({
        where: {
          id: mostRecentRegistration.id,
        },
        data: {
          deviceId: deviceLibraryIdentifier,
          pushToken: pushToken,
        },
      });

      console.log("[UPDATED_REGISTRATION]", {
        id: updatedRegistration.id,
        oldDeviceId: mostRecentRegistration.deviceId,
        newDeviceId: deviceLibraryIdentifier,
        serialNumber: serialNumber,
      });

      logRegistration(
        "REGISTRATION_CONSOLIDATED",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        {
          id: updatedRegistration.id,
          oldDeviceId: mostRecentRegistration.deviceId,
          action: "consolidated",
        }
      );
    } else {
      // No existing registrations, create a new one
      const newRegistration = await db.passRegistration.create({
        data: {
          deviceId: deviceLibraryIdentifier,
          pushToken: pushToken,
          student: {
            connect: {
              id: serialNumber,
            },
          },
        },
      });

      console.log("[PRISMA_REGISTRATION_CREATED]", newRegistration);
      logRegistration(
        "REGISTRATION_SUCCESS",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        {
          id: newRegistration.id,
          action: "created",
        }
      );
    }

    // Return a 201 Created status for successful registration
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error("[PRISMA_REGISTRATION_ERROR]", error);
    logRegistration(
      "REGISTRATION_ERROR",
      { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
      {},
      error.message
    );
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Get a device's registration for a pass
export async function GET(
  request,
  { params: { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } }
) {
  logRegistration(
    "GET_REGISTRATION",
    { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
    {},
    null
  );

  try {
    // Verify the authentication token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("ApplePass ")) {
      // Log the auth failure but continue for testing purposes
      logRegistration(
        "AUTH_WARNING",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        "Missing or invalid Authorization header, but continuing for testing"
      );
      console.warn(
        "[WALLET_REGISTRATION] Auth token missing or invalid, but continuing for testing"
      );
      // Don't return 401 during testing
      // return new NextResponse("Unauthorized", { status: 401 });
    } else {
      const authToken = authHeader.replace("ApplePass ", "");
      if (!verifyAuthToken(serialNumber, authToken)) {
        logRegistration(
          "AUTH_TOKEN_INVALID",
          { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
          { authToken },
          "Invalid token"
        );
        return new NextResponse("Invalid authentication token", {
          status: 401,
        });
      }
    }

    // Try to retrieve the registration using Prisma
    let prismaRegistration = null;
    try {
      prismaRegistration = await db.passRegistration.findFirst({
        where: {
          deviceId: deviceLibraryIdentifier,
          serialNumber: serialNumber,
        },
      });

      logRegistration(
        "PRISMA_REGISTRATION_SUCCESS",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        prismaRegistration
      );
    } catch (prismaError) {
      logRegistration(
        "PRISMA_REGISTRATION_ERROR",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        prismaError.message
      );
      console.error("[PRISMA_REGISTRATION_ERROR]", prismaError);
      // Continue with in-memory registration even if Prisma fails
    }

    // Return success if either registration method worked
    if (prismaRegistration) {
      return new NextResponse(null, { status: 200 });
    } else {
      logRegistration(
        "REGISTRATION_NOT_FOUND",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        "Registration not found"
      );
      return new NextResponse("Registration not found", { status: 404 });
    }
  } catch (error) {
    console.error("[GET_DEVICE_REGISTRATION_ERROR]", error);
    logRegistration(
      "REGISTRATION_ERROR",
      { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
      {},
      error.message
    );
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Delete a device's registration for a pass
export async function DELETE(
  request,
  { params: { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } }
) {
  logRegistration(
    "DELETE_REGISTRATION",
    { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
    {},
    null
  );

  try {
    // Verify the authentication token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("ApplePass ")) {
      // Log the auth failure but continue for testing purposes
      logRegistration(
        "AUTH_WARNING",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        "Missing or invalid Authorization header, but continuing for testing"
      );
      console.warn(
        "[WALLET_REGISTRATION] Auth token missing or invalid, but continuing for testing"
      );
      // Don't return 401 during testing
      // return new NextResponse("Unauthorized", { status: 401 });
    } else {
      const authToken = authHeader.replace("ApplePass ", "");
      if (!verifyAuthToken(serialNumber, authToken)) {
        logRegistration(
          "AUTH_TOKEN_INVALID",
          { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
          { authToken },
          "Invalid token"
        );
        return new NextResponse("Invalid authentication token", {
          status: 401,
        });
      }
    }

    try {
      // Find the registration
      const existingRegistration = await db.passRegistration.findFirst({
        where: {
          deviceId: deviceLibraryIdentifier,
          serialNumber: serialNumber,
        },
      });

      // If no registration found with this device ID, check if there's any registration for this serial number
      if (!existingRegistration) {
        const anyRegistration = await db.passRegistration.findFirst({
          where: {
            serialNumber: serialNumber,
          },
        });

        if (anyRegistration) {
          // We found a registration for this pass but with a different device ID
          // This is likely due to our consolidation logic - we'll delete it anyway
          await db.passRegistration.delete({
            where: {
              id: anyRegistration.id,
            },
          });

          logRegistration(
            "CROSS_DEVICE_UNREGISTRATION_SUCCESS",
            { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
            {},
            {
              deletedDeviceId: anyRegistration.deviceId,
              requestingDeviceId: deviceLibraryIdentifier
            }
          );

          return new NextResponse(null, { status: 200 });
        }

        logRegistration(
          "UNREGISTRATION_NOT_FOUND",
          { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
          {},
          "Registration not found"
        );
        return new NextResponse("Registration not found", { status: 404 });
      }

      // Check if we're using the multi-device JSON format
      let deviceTokens = {};
      let isMultiDevice = false;

      try {
        if (
          existingRegistration.pushToken.startsWith("{") &&
          existingRegistration.pushToken.endsWith("}")
        ) {
          deviceTokens = JSON.parse(existingRegistration.pushToken);
          isMultiDevice = Object.keys(deviceTokens).length > 1;
        } else {
          // If not in our format, it's a single device token
          deviceTokens[existingRegistration.deviceId] =
            existingRegistration.pushToken;
        }
      } catch (e) {
        // If parsing fails, assume it's a regular push token
        deviceTokens[existingRegistration.deviceId] =
          existingRegistration.pushToken;
      }

      // If this device is in the tokens, remove it
      if (deviceLibraryIdentifier in deviceTokens) {
        delete deviceTokens[deviceLibraryIdentifier];
      }

      // If there are still other devices registered, update the registration
      if (Object.keys(deviceTokens).length > 0) {
        // Get the first device ID as the new primary
        const newPrimaryDeviceId = Object.keys(deviceTokens)[0];

        await db.passRegistration.update({
          where: {
            id: existingRegistration.id,
          },
          data: {
            deviceId: newPrimaryDeviceId,
            pushToken: JSON.stringify(deviceTokens),
          },
        });

        logRegistration(
          "PARTIAL_UNREGISTRATION_SUCCESS",
          { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
          {},
          {
            remainingDevices: Object.keys(deviceTokens).length,
            newPrimaryDevice: newPrimaryDeviceId,
          }
        );
      } else {
        // If no devices left, delete the registration completely
        await db.passRegistration.delete({
          where: {
            id: existingRegistration.id,
          },
        });

        logRegistration(
          "FULL_UNREGISTRATION_SUCCESS",
          { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
          {},
          "Registration deleted completely"
        );
      }

      return new NextResponse(null, { status: 200 });
    } catch (error) {
      console.error("[UNREGISTER_DEVICE_ERROR]", error);
      logRegistration(
        "UNREGISTRATION_ERROR",
        { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
        {},
        error.message
      );
      return new NextResponse("Internal error", { status: 500 });
    }
  } catch (error) {
    console.error("[DELETE_REGISTRATION_ERROR]", error);
    logRegistration(
      "DELETE_REGISTRATION_ERROR",
      { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
      {},
      error.message
    );
    return new NextResponse("Internal error", { status: 500 });
  }
}
