import { NextResponse } from "next/server";
import { generateStudentID } from "@/lib/wallet";
import { auth } from "@/auth";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "Admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return new NextResponse("Application ID is required", { status: 400 });
    }

    const result = await generateStudentID(applicationId, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[WALLET_GENERATE_ERROR]", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
