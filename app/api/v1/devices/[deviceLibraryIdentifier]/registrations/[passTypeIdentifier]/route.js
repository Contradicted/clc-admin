import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper function to log requests
function logRegistration(eventType, params, headers, data) {
  const logEntry = {
    type: eventType,
    params,
    timestamp: new Date().toISOString(),
    headers,
    data
  };
  
  console.log(`[WALLET_REGISTRATION] ${eventType}: ${JSON.stringify({ params, timestamp: new Date().toISOString() })}`);
  
  // Optionally log to a file or database for persistent debugging
}

// GET endpoint to get all registrations for a device and pass type
export async function GET(
  request,
  { params: { deviceLibraryIdentifier, passTypeIdentifier } }
) {
  console.log("==================================================");
  console.log(`[WALLET_API] GET_REQUEST at ${new Date().toISOString()}`);
  console.log(`Device: ${deviceLibraryIdentifier}`);
  console.log(`Pass Type: ${passTypeIdentifier}`);
  console.log(`URL: ${request.url}`);
  
  // Log all headers for debugging
  const headers = Object.fromEntries(request.headers);
  console.log(`Headers: ${JSON.stringify(headers)}`);
  console.log("==================================================");
  
  logRegistration("GET_REGISTRATIONS", { deviceLibraryIdentifier, passTypeIdentifier }, headers, null);
  
  try {
    // Check authentication (optional for testing)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("ApplePass ")) {
      console.warn("[WARNING] Missing or invalid Authorization header");
    }
    
    // Get all registrations from Prisma
    const registrations = await db.passRegistration.findMany({
      where: {
        deviceId: deviceLibraryIdentifier,
      },
      select: {
        serialNumber: true,
        deviceId: true,
        pushToken: true,
        updatedAt: true,
      },
    });
    
    console.log("[PRISMA_REGISTRATIONS_SUCCESS]", { count: registrations.length });
    logRegistration("PRISMA_REGISTRATIONS_SUCCESS", { deviceLibraryIdentifier, passTypeIdentifier }, headers, { count: registrations.length });
    
    // Extract serial numbers
    const serialNumbers = registrations.map(reg => reg.serialNumber);
    
    // Find the most recent update timestamp
    let lastUpdated = new Date().toISOString();
    if (registrations.length > 0) {
      const timestamps = registrations.map(reg => reg.updatedAt);
      const mostRecent = new Date(Math.max(...timestamps.map(t => t.getTime())));
      lastUpdated = mostRecent.toISOString();
    }
    
    console.log("[GET_REGISTRATIONS] Success", { serialNumbers });
    logRegistration("GET_REGISTRATIONS_SUCCESS", { deviceLibraryIdentifier, passTypeIdentifier }, headers, { serialNumbers });
    
    // Format the response according to Apple's requirements
    const responseData = {
      serialNumbers,
      lastUpdated
    };
    
    console.log("[RESPONSE_DATA]", responseData);
    
    // Return the response with the correct Content-Type header
    return new NextResponse(JSON.stringify(responseData), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("[GET_REGISTRATIONS_ERROR]", error);
    logRegistration("GET_REGISTRATIONS_ERROR", { deviceLibraryIdentifier, passTypeIdentifier }, headers, error.message);
    return new NextResponse("Internal error", { status: 500 });
  }
}
