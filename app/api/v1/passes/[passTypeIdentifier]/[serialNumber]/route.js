import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApplePass } from "@/lib/apple-wallet";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function GET(
  request,
  { params: { passTypeIdentifier, serialNumber } }
) {
  try {
    // Verify the authentication token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("ApplePass ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the enrolled student
    const student = await db.enrolledStudent.findUnique({
      where: { id: serialNumber },
      include: {
        application: {
          include: {
            user: true,
            course: true,
          },
        },
      },
    });

    if (!student) {
      return new NextResponse("Pass not found", { status: 404 });
    }

    // Check if the pass needs to be updated (based on idActiveAt timestamp)
    const lastModified = request.headers.get("if-modified-since");
    if (lastModified && student.idActiveAt) {
      const lastModifiedDate = new Date(lastModified);
      const passModifiedDate = new Date(student.idActiveAt);

      if (lastModifiedDate >= passModifiedDate) {
        return new NextResponse(null, { status: 304 }); // Not Modified
      }
    }

    // Prepare student data
    const studentData = {
      id: student.id,
      firstName: student.application.user.firstName,
      lastName: student.application.user.lastName,
      email: student.application.user.email,
      studentId: student.id,
      campus: student.campus,
      faculty: student.application.faculty ?? "Business",
      course: student.application.course,
      studyMode: student.application.studyMode,
    };

    let photoBuffer;
    try {
      // Check if photoUrl exists
      if (student.application.photoUrl) {
        // Get the photo buffer from URL
        const photoResponse = await fetch(student.application.photoUrl);
        if (photoResponse.ok) {
          const arrayBuffer = await photoResponse.arrayBuffer();
          const originalBuffer = Buffer.from(arrayBuffer);
          
          // Create a circular mask
          const roundedCorners = Buffer.from(
            '<svg><circle cx="125" cy="125" r="125" /></svg>'
          );
          
          // Process with Sharp
          const processedBuffer = await sharp(originalBuffer)
            .resize(250, 250, { fit: "cover", position: "centre" })
            .png()
            .composite([
              {
                input: roundedCorners,
                blend: "dest-in",
              },
            ])
            .toBuffer();
            
          // Create final buffer for Apple Wallet
          photoBuffer = await sharp(processedBuffer).png().toBuffer();
          
          console.log("[APPLE_PASS] Photo processed successfully");
        } else {
          throw new Error(`Failed to fetch photo: ${photoResponse.status}`);
        }
      } else {
        throw new Error("No photo URL available");
      }
    } catch (error) {
      console.warn(
        `[GET_PASS_PHOTO_ERROR] ${error.message}. Using default photo.`
      );
      // Use a default photo if the URL is missing or fetch fails
      const defaultPhotoPath = path.join(
        process.cwd(),
        "public",
        "placeholder-user.png"
      );
      
      try {
        const defaultBuffer = await fs.readFile(defaultPhotoPath);
        
        // Process the default photo the same way
        const roundedCorners = Buffer.from(
          '<svg><circle cx="125" cy="125" r="125" /></svg>'
        );
        
        const processedBuffer = await sharp(defaultBuffer)
          .resize(250, 250, { fit: "cover", position: "centre" })
          .png()
          .composite([
            {
              input: roundedCorners,
              blend: "dest-in",
            },
          ])
          .toBuffer();
          
        photoBuffer = await sharp(processedBuffer).png().toBuffer();
      } catch (err) {
        // If default photo can't be read, create a simple colored buffer
        console.warn(
          "[GET_PASS_PHOTO_ERROR] Default photo not found. Using generated placeholder."
        );
        const size = 300;
        const buffer = Buffer.alloc(size * size * 4);
        // Fill with light blue color (RGBA)
        for (let i = 0; i < buffer.length; i += 4) {
          buffer[i] = 135; // R
          buffer[i + 1] = 206; // G
          buffer[i + 2] = 235; // B
          buffer[i + 3] = 255; // A
        }
        photoBuffer = buffer;
      }
    }

    // Generate the pass
    const passBuffer = await generateApplePass(
      studentData,
      photoBuffer,
      student.idActive
    );

    // Use current date if idActiveAt is null
    const lastModifiedDate = student.idActiveAt
      ? student.idActiveAt.toUTCString()
      : new Date().toUTCString();

    // Return the pass with correct headers
    return new NextResponse(passBuffer, {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": lastModifiedDate,
      },
    });
  } catch (error) {
    console.error("[GET_PASS_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
