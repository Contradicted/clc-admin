import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, currentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/nodemailer";
import crypto from "crypto";
import { graphClient } from "@/lib/office365";

export async function POST(req) {
  try {
    // Check if user is authenticated
    const user = await currentUser();
    if (!user || !["Admin", "Staff"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const { students, subject, content: rawContent } = await req.json();

    // Validate required fields
    if (!students || !Array.isArray(students) || !subject || !rawContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert newlines to <br> tags for HTML email and format properly
    const content = `<div style="font-family: Arial, sans-serif;">
      ${rawContent.replace(/\n/g, "<br />")}
    </div>`;

    // Generate a unique batch ID for this sending operation
    const batchId = crypto.randomUUID();

    // Debug: Log the first student object to see its structure
    if (students.length > 0) {
      console.log('DEBUG - First student object structure:');
      console.log(JSON.stringify(students[0], null, 2));
      console.log('Available email fields:', Object.keys(students[0]).filter(key => key.toLowerCase().includes('email')));
    }

    // Track results
    const results = {
      total: students.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send emails in batches to avoid overwhelming the server
    for (const student of students) {
      try {
        // Determine which email addresses to use
        const emailAddresses = new Set(); // Using Set to avoid duplicates
        
        // Debug: Log all email-related fields for this student
        console.log(`DEBUG - Student ${student.id} email fields:`, 
          Object.entries(student)
            .filter(([key]) => key.toLowerCase().includes('email'))
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}));
        
        // Check if we should send to both email addresses when available
        const sendToBothEmails = student.sendToBothEmails === true;
        console.log(`DEBUG - Send to both emails? ${sendToBothEmails ? 'Yes' : 'No'}`);
        
        // If sendToBothEmails is true, collect all available email addresses
        if (sendToBothEmails) {
          console.log(`DEBUG - Collecting all available email addresses`);
          
          // Add the main email if present
          if (student.email) {
            console.log(`DEBUG - Adding primary email: ${student.email}`);
            emailAddresses.add(student.email);
          }
          
          // Check for office365Email in the enrolledStudent object
          if (student.enrolledStudent?.office365Email) {
            console.log(`DEBUG - Adding office365Email: ${student.enrolledStudent.office365Email}`);
            emailAddresses.add(student.enrolledStudent.office365Email);
          }
          
          // Check for personalEmail in the enrolledStudent object
          if (student.enrolledStudent?.personalEmail) {
            console.log(`DEBUG - Adding personalEmail: ${student.enrolledStudent.personalEmail}`);
            emailAddresses.add(student.enrolledStudent.personalEmail);
          }
        }
        // Otherwise just use the specified email
        else if (student.email) {
          console.log(`DEBUG - Using specified email only: ${student.email}`);
          emailAddresses.add(student.email);
        }
        
        // Convert Set back to array
        const uniqueEmailAddresses = Array.from(emailAddresses);
        
        // If no emails found at all
        if (uniqueEmailAddresses.length === 0) {
          const errorMsg = "No email address available";
          results.failed++;
          results.errors.push({ studentId: student.id, error: errorMsg });
          await db.emailLog.create({
              data: { subject, content, studentID: student.id, senderID: user.id, status: "failed", error: errorMsg, batchId },
          });
          continue;
        }
        
        // Send to each email address
        for (const emailAddress of uniqueEmailAddresses) {
          console.log(`Attempting to send email via Graph API to: ${emailAddress}`);
          await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post({
              message: {
                  subject,
                  body: { contentType: 'HTML', content },
                  toRecipients: [{ emailAddress: { address: emailAddress } }]
              }
          });
          console.log(`Email sent successfully to: ${emailAddress}`);
        }
        
        // Count as one successful send per student, regardless of how many emails they received
        results.sent++;
        // Log one entry per student, regardless of how many emails were sent
        await db.emailLog.create({
            data: { 
                subject, 
                content, 
                studentID: student.id, 
                senderID: user.id, 
                status: "sent", 
                batchId
            },
        });
        
        // Log which emails were sent in the console for debugging
        console.log(`Emails sent for student ${student.id}: ${uniqueEmailAddresses.join(", ")}`);

      } catch (error) {
        const studentInfo = student ? `to ${student.email} (ID: ${student.id})` : '(unknown student)';
        console.error(`Error sending email ${studentInfo}:`, error);
        
        results.failed++;
        // Extract a more useful error message from the Graph API response
        let errorMessage = "Failed to send email";
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
        
        results.errors.push({ studentId: student?.id, error: errorMessage });

        // Log the failed email in the database
        try {
            if (student) {
                // Determine which emails we attempted to send to
                let attemptedEmails = [];
                if (student.email) {
                    attemptedEmails.push(student.email);
                }
                if (student.enrolledStudent?.office365Email) {
                    attemptedEmails.push(student.enrolledStudent.office365Email);
                }
                if (student.enrolledStudent?.personalEmail) {
                    attemptedEmails.push(student.enrolledStudent.personalEmail);
                }
                
                await db.emailLog.create({
                    data: { 
                        subject, 
                        content, 
                        studentID: student.id, 
                        senderID: user.id, 
                        status: "failed", 
                        error: errorMessage, 
                        batchId
                    },
                });
                
                // Log which emails were attempted in the console for debugging
                console.log(`Failed emails for student ${student.id}: ${attemptedEmails.join(", ")}`);
            }
        } catch (dbError) {
            console.error(`Failed to log email error to database for student ${student?.id}:`, dbError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      results 
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails", details: error.message },
      { status: 500 }
    );
  }
}
