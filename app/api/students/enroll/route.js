import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { createStudentAccount } from "@/lib/office365";
import { graphClient } from "@/lib/office365";
import { generateStudentID } from "@/lib/id";
import nodemailer from "nodemailer";
import { currentUser } from "@/lib/auth";
import { logActivity } from "@/actions/activity-log";
import { getDisplayStatus } from "@/lib/utils";

const db = new PrismaClient();

// Helper function to send Office 365 credentials email
async function sendOffice365Credentials(credentials, application) {
  const { office365Email, office365Password } = credentials;

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME || "admissions@clc-london.ac.uk",
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: `"CLC Admissions" <${process.env.MAIL_USERNAME || "admissions@clc-london.ac.uk"}>`,
    to: application.email,
    subject: "Your City of London College student email account is ready",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your City of London College student email account is ready</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <img src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg" width="220" height="140" alt="clc-logo" style="display: block; margin: 0 auto 20px;">
          <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">
          
          <p>Dear ${application.firstName} ${application.lastName},</p>
          
          <p>Your City of London College student email account has been created and is ready to use.
          Please find your account details below:</p>

          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #ff6f00; background-color: #fff8e1;">
            <h3 style="margin: 0 0 15px 0; color: #ff6f00; font-size: 16px;">Your Account Credentials</h3>
            <div style="background-color: #ffffff; padding: 10px 15px; margin-bottom: 10px; border-radius: 4px;">
              <p style="margin: 0;"><strong>Email Address:</strong> ${office365Email}</p>
            </div>
            <div style="background-color: #ffffff; padding: 10px 15px; border-radius: 4px;">
              <p style="margin: 0;"><strong>Temporary Password:</strong> ${office365Password}</p>
            </div>
          </div>

          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #e74c3c; background-color: #fef9f8;">
            <h3 style="margin: 0 0 10px 0; color: #e74c3c; font-size: 16px;">Important Information</h3>
            <ol style="margin: 10px 0; padding-left: 25px; line-height: 1.5;">
              <li>You <strong>must</strong> change your password when you first log in</li>
              <li>This email account will be used for all official college communications</li>
              <li>You can access your email at <a href="https://outlook.office.com" style="color: #0078d4; text-decoration: underline;">outlook.office.com</a></li>
            </ol>
          </div>

          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #0078d4; background-color: #f8f9fa;">
            <h3 style="margin: 0 0 10px 0; color: #0078d4; font-size: 16px;">Managing Your Assignments</h3>
            
            <h4 style="margin: 15px 0 5px 0; color: #0078d4; font-size: 14px;">Accessing Assignments:</h4>
            <ol style="margin: 5px 0 15px 0; padding-left: 25px; line-height: 1.5;">
              <li>Log in to Microsoft Teams by clicking <a href="https://teams.microsoft.com" style="color: #0078d4; text-decoration: underline;">here</a> or by visiting <a href="https://teams.microsoft.com" style="color: #0078d4; text-decoration: underline;">teams.microsoft.com</a></li>
              <li>Click on the "Teams" tab</li>
              <li>Click on the class name</li>
              <li>Click on the "Assignments" tab</li>
            </ol>
            
            <h4 style="margin: 15px 0 5px 0; color: #0078d4; font-size: 14px;">Submitting Assignments:</h4>
            <ol style="margin: 5px 0; padding-left: 25px; line-height: 1.5;">
              <li>Follow steps 1-4 above to access your assignments</li>
              <li>Click on the assignment name</li>
              <li>Click on the "Turnitin Assignment" button</li>
              <li>Upload your work and submit before the deadline</li>
            </ol>
            
            <p style="margin: 15px 0 0 0; line-height: 1.5; font-style: italic;">Please ensure that you read all instructions carefully and submit your assignments on time. Late submissions may result in grade penalties.</p>
          </div>

          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #0078d4; background-color: #f8f9fa;">
            <h3 style="margin: 0 0 10px 0; color: #0078d4; font-size: 16px;">Accessing Class Materials</h3>
            <ol style="margin: 10px 0; padding-left: 25px; line-height: 1.5;">
              <li>Log in to Microsoft Teams by clicking <a href="https://teams.microsoft.com" style="color: #0078d4; text-decoration: underline;">here</a> or by visiting <a href="https://teams.microsoft.com" style="color: #0078d4; text-decoration: underline;">teams.microsoft.com</a></li>
              <li>Click on the "Teams" tab</li>
              <li>Click on the class name</li>
              <li>Click on the General channel</li>
              <li>Click on the "Files" tab at the top</li>
            </ol>
            <p style="margin: 10px 0; line-height: 1.5;">From there, you will see a "Class Materials" folder which contains all your course resources.</p>
          </div>

          <div style="margin: 10px 0;">
            <p>For guidance on how to setup your account, please watch this video <a href="https://www.youtube.com/watch?v=sup6jQ6C85o">here</a>.</p>
            <p>If you have any issues accessing your account, please contact our IT support team.</p>
          </div>

          <p>
            Best regards,<br>
            Admissions Office<br>
            City of London College
          </p>

          <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">
          <p style="font-size: 12px; color: #666666;">
            NOTE: This e-mail message was sent from a notification-only address
            that cannot accept incoming e-mail. Please do not reply to this message.
          </p>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req) {
  try {
    // Get the current user session
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return NextResponse.json(
        { message: "Unauthorised" },
        { status: 401 }
      );
    }

    // Parse request body
    const { applicationId } = await req.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { message: "Application ID is required" },
        { status: 400 }
      );
    }

    // Get application with course details
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        course: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: `Application not found with ID: ${applicationId}` },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    const existingEnrolledStudent = await db.enrolledStudent.findFirst({
      where: { applicationID: applicationId },
    });

    if (existingEnrolledStudent) {
      return NextResponse.json(
        { 
          message: `Student is already enrolled with ID: ${existingEnrolledStudent.id}`,
          enrolledStudent: existingEnrolledStudent
        },
        { status: 400 }
      );
    }

    // Generate the student ID
    const studentId = await generateStudentID(application.campus);
    
    // Check if Office 365 account already exists
    let office365Account;
    let office365Email;
    let existingO365Account = false;
    
    try {
      // Try to find an existing Office 365 account with a similar name pattern
      const searchQuery = `${application.firstName.toLowerCase()}.${application.lastName.toLowerCase()}`;
      const users = await graphClient.api('/users')
        .filter(`startswith(userPrincipalName, '${searchQuery}')`)
        .select('id,userPrincipalName,displayName')
        .get();
        
      if (users && users.value && users.value.length > 0) {
        // Found existing account(s), use the first one
        existingO365Account = true;
        office365Email = users.value[0].userPrincipalName;
        
        // Generate a new password
        const newPassword = `Welcome${studentId}!`;
        
        // Reset the password and force change at next sign-in
        await graphClient.api(`/users/${office365Email}`).update({
          passwordProfile: {
            password: newPassword,
            forceChangePasswordNextSignIn: true,
          },
        });
        
        // Store the credentials for email
        office365Account = {
          email: office365Email,
          password: newPassword
        };
      } else {
        // No existing account found, create a new one
        office365Account = await createStudentAccount({
          firstName: application.firstName,
          lastName: application.lastName,
          id: studentId,
          personalEmail: application.email,
          course: application.course.name,
          campus: application.campus,
          commencementDate: application.commencement,
        });
        
        office365Email = office365Account.email;
      }
    } catch (error) {
      console.error("Error checking/creating Office 365 account:", error);
      
      // If there's an error checking for existing account, create a new one
      office365Account = await createStudentAccount({
        firstName: application.firstName,
        lastName: application.lastName,
        id: studentId,
        personalEmail: application.email,
        course: application.course.name,
        campus: application.campus,
        commencementDate: application.commencement,
      });
      
      office365Email = office365Account.email;
    }

    // Create enrolled student with Office 365 email
    const enrolledStudent = await db.enrolledStudent.create({
      data: {
        id: studentId,
        firstName: application.firstName,
        lastName: application.lastName,
        dateOfBirth: application.dateOfBirth,
        email: application.email,
        campus: application.campus,
        ...(application.photoUrl && {
          profile_picture_url: application.photoUrl,
        }),
        ...(application.photoName && {
          profile_picture_name: application.photoName,
        }),
        application: {
          connect: {
            id: application.id,
          },
        },
        user: {
          connect: {
            id: application.userID,
          },
        },
        office365Email,
        office365Active: true,
        office365ActiveAt: new Date(),
      },
    });

    // Update application status to Enrolled
    await db.application.update({
      where: { id: application.id },
      data: { status: "Enrolled" },
    });

    // Log the change to audit tracking
    await logActivity(user.id, application.id, "UPDATE_APPLICATION_STATUS", {
      field: "status",
      prevValue: getDisplayStatus(application.status),
      newValue: getDisplayStatus("Enrolled"),
    });

    // Send Office 365 credentials email
    try {
      await sendOffice365Credentials(
        { office365Email, office365Password: office365Account.password },
        application
      );
      console.log("Sent Office 365 credentials email");
    } catch (emailError) {
      console.error("Error sending Office 365 email:", emailError.message);

      // Create note about the failure
      await db.note.create({
        data: {
          content: `Warning: Student enrolled but Office 365 email sending failed: ${emailError.message}`,
          type: "Admin",
          applicationID: application.id,
          userID: user.id,
        },
      });
    }

    // Create note for enrollment
    await db.note.create({
      data: {
        content: `Student enrolled successfully. Created enrolled student record with ID ${enrolledStudent.id}${office365Email ? ` and Office 365 account ${office365Email}` : ""}. Sent enrollment confirmation email.`,
        type: "Admin",
        applicationID: application.id,
        userID: user.id,
      },
    });

    return NextResponse.json({
      message: "Student enrolled successfully",
      enrolledStudent,
      office365Email,
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { message: `Failed to enroll student: ${error.message}` },
      { status: 500 }
    );
  }
}
