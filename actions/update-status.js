"use server";

import { getApplicationByID } from "@/data/application";
import { getStudentByID, getUserById } from "@/data/student";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEnrolledStudent } from "@/lib/id";
import {
  sendConditionalLetterOfAcceptanceEmail,
  sendOffice365Email,
  updateStatusEmail,
} from "@/lib/mail";
import { createStudentAccount } from "@/lib/office365";
import { generateUpdateApplicationToken } from "@/lib/tokens";
import { getDisplayStatus } from "@/lib/utils";

export const updateStatus = async (emailMsg, applicationID, status) => {
  const user = await currentUser();
  const application = await getApplicationByID(applicationID);
  const student = await getStudentByID(application.userID);
  const currentAdmin = await getUserById(user.id);

  if (!student) {
    throw new Error("User does not exist!");
  }

  if (!application) {
    throw new Error("Application with this ID doesn't exist!");
  }

  if (status === application.status) {
    return {
      error: `This application is already ${getDisplayStatus(status)}!`,
    };
  }

  await db.application.update({
    where: {
      id: application.id,
    },
    data: {
      status,
    },
  });

  if (status === "Sent_conditional_letter") {
    try {
      // Send approval email
      await updateStatusEmail(status, application, student, "", emailMsg);

      // Send conditional letter of acceptance email
      await sendConditionalLetterOfAcceptanceEmail(application, student);

      // Create note for approval
      await db.note.create({
        data: {
          content: "Sent conditional letter of acceptance",
          type: "Admin",
          applicationID: application.id,
          userID: currentAdmin.id,
        },
      });

      return { success: "Successfully updated status!" };
    } catch (error) {
      console.error("Error in approval process:", error);
      return {
        error: "Failed to complete approval process. Please try again.",
      };
    }
  } else if (status === "Enrolled") {
    try {
      // Create enrolled student
      let enrolledStudent;
      try {
        enrolledStudent = await createEnrolledStudent(
          application.id,
          application.campus
        );
      } catch (enrollError) {
        // Handle specific validation errors
        if (
          enrollError.message.includes("already enrolled") ||
          enrollError.message.includes("Invalid email format") ||
          enrollError.message.includes("Missing required fields") ||
          enrollError.message.includes("Invalid name") ||
          enrollError.message.includes("profile picture") ||
          enrollError.message.includes("course not found") ||
          enrollError.message.includes("course is not available")
        ) {
          return { error: enrollError.message };
        }

        console.error("Unexpected enrollment error:", enrollError);
        throw enrollError;
      }

      // Create Office 365 account
      let office365Email, office365Password;
      try {
        const office365Account = await createStudentAccount({
          firstName: student.firstName,
          lastName: student.lastName,
          id: enrolledStudent.id,
          personalEmail: student.email,
          course: application.course.name,
          campus: enrolledStudent.campus,
          commencementDate: application.commencement,
        });
        office365Email = office365Account.email;
        office365Password = office365Account.password;

        // Update enrolled student with Office 365 email
        await db.enrolledStudent.update({
          where: { id: enrolledStudent.id },
          data: { office365Email, office365Active: true, office365ActiveAt: new Date() },
        });
      } catch (office365Error) {
        console.error("Office 365 account creation error:", office365Error);

        // Create note about the failure
        await db.note.create({
          data: {
            content: `Warning: Student record created but Office 365 account creation failed: ${office365Error.message}`,
            type: "Admin",
            applicationID: application.id,
            userID: currentAdmin.id,
          },
        });

        // Continue with enrollment process but notify admin
        return {
          warning:
            "Student enrolled successfully but Office 365 account creation failed. IT team has been notified.",
          success: "Application status updated.",
        };
      }

      // Send issuance of enrollment letter email
      await updateStatusEmail(status, application, student, "", emailMsg);

      // Send enrollment letter email
      // await sendConditionalLetterOfAcceptanceEmail(application, student);

      // Send email with student account details
      await sendOffice365Email(
        { office365Email, office365Password },
        application
      );

      // Create note for enrollment
      await db.note.create({
        data: {
          content: `Student enrolled successfully. Created enrolled student record with ID ${enrolledStudent.id}${office365Email ? ` and Office 365 account ${office365Email}` : ""}. Sent enrollment confirmation email.`,
          type: "Admin",
          applicationID: application.id,
          userID: currentAdmin.id,
        },
      });

      return { success: "Successfully enrolled student!" };
    } catch (error) {
      console.error("Error in enrollment process:", error);

      if (error.code === "P2002") {
        return { error: "This student has already been enrolled." };
      }

      if (error.code === "P2034") {
        return {
          error: "The enrollment process was interrupted. Please try again.",
        };
      }

      return {
        error:
          "Failed to complete enrollment process. Please try again or contact support if the issue persists.",
      };
    }
  } else if (status === "Waiting_for_Change") {
    const updateApplicationToken = await generateUpdateApplicationToken(
      student.email,
      application.id
    );
    await updateStatusEmail(
      status,
      application,
      student,
      updateApplicationToken.token,
      emailMsg
    );

    await db.note.create({
      data: {
        content: `Application requested for change. ${emailMsg ? `Message: ${emailMsg}` : ""}`,
        type: "Admin",
        applicationID: application.id,
        userID: currentAdmin.id,
      },
    });

    return { success: "Successfully updated status!" };
  } else if (status === "Withdrawn") {
    // 1. Check if student email has been generated
    // 2. Check if digital ID has been issued
    // 3. Delete if true
    // 4. Send email
    // 5. Update status

    await updateStatusEmail(status, application, student, "", emailMsg);
  } else {
    await updateStatusEmail(status, application, student, "", emailMsg);
  }

  // Create note
  await db.note.create({
    data: {
      content: `Changed status of application to ${getDisplayStatus(status)}. ${emailMsg ? `Message: ${emailMsg}` : ""}`,
      type: "Admin",
      applicationID: application.id,
      userID: currentAdmin.id,
    },
  });

  return { success: "Successfully updated status!" };
};
