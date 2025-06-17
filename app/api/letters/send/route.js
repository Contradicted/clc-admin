import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { graphClient } from "@/lib/office365";
import { logActivity } from "@/actions/activity-log";

export async function POST(req) {
  try {
    // Check if user is authenticated
    const user = await currentUser();
    if (!user || !["Admin", "Staff"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { applicationId, templateId, templateName, subject, pdfAttachment } =
      await req.json();

    // Validate required fields
    if (
      !applicationId ||
      !templateId ||
      !templateName ||
      !subject ||
      !pdfAttachment
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get application details
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrolledStudent: {
          select: {
            id: true,
            office365Email: true,
            office365Active: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Use email from application record, fallback to user record
    const recipientEmail = application.email || application.user?.email;
    const recipientName = `${application.firstName} ${application.lastName}`;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No email address found for this application" },
        { status: 400 }
      );
    }

    // Prepare list of recipients
    const recipients = [
      {
        emailAddress: {
          address: recipientEmail,
          name: recipientName,
        },
      },
    ];

    // Add Office 365 email if student is enrolled and has active Office 365 account
    if (
      application.enrolledStudent?.office365Email &&
      application.enrolledStudent?.office365Active &&
      application.enrolledStudent.office365Email !== recipientEmail
    ) {
      recipients.push({
        emailAddress: {
          address: application.enrolledStudent.office365Email,
          name: recipientName,
        },
      });
    }

    // Prepare email content
    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Dear ${application.firstName} ${application.lastName},</p>
        
        <p>Please find attached your letter from City of London College.</p>
        
        <p>If you have any questions or need further assistance, please don't hesitate to contact our admissions team.</p>
        
        <p>Best regards,<br>
        Admissions Office<br>
        City of London College</p>
        
        <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">
        <p style="font-size: 12px; color: #666666;">
          This email was sent from City of London College's automated system.
        </p>
      </div>
    `;

    // Send email via Microsoft Graph API
    await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post({
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: emailBody,
        },
        toRecipients: recipients,
        attachments: [
          {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: pdfAttachment.filename,
            contentType: "application/pdf",
            contentBytes: pdfAttachment.content,
          },
        ],
      },
    });

    // Create note in database
    const emailAddresses = recipients.map((r) => r.emailAddress.address);
    const noteContent = `Sent "${templateName}" letter`;

    await db.note.create({
      data: {
        content: noteContent,
        type: "Admin",
        applicationID: applicationId,
        userID: user.id,
      },
    });

    // Log activity
    await logActivity(user.id, applicationId, "SENT_LETTER", {
      field: "Letter",
      prevValue: null,
      newValue: {
        templateName,
        subject,
        recipients: emailAddresses.join("\n"),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Letter sent successfully",
    });
  } catch (error) {
    console.error("Error sending letter:", error);

    // Extract a more useful error message from the Graph API response
    let errorMessage = "Failed to send letter";
    if (error.body) {
      try {
        const errorBody = JSON.parse(error.body);
        errorMessage = errorBody.error?.message || JSON.stringify(errorBody);
      } catch (e) {
        errorMessage = error.body;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
