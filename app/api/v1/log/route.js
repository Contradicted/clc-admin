import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const logs = await request.json();
    
    // Log the messages (you can customize this based on your needs)
    console.log("[APPLE_PASS_LOGS]", logs);
    
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[LOG_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
