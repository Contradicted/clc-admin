"use server";

import { getApplicationByID } from "@/data/application";
import { getStudentByID, getUserById } from "@/data/student";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  sendConditionalLetterOfAcceptanceEmail,
  updateStatusEmail,
} from "@/lib/mail";
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

  if (status === "Approved") {
    try {
      // Send approval email
      await updateStatusEmail(status, application, student, "", emailMsg);

      // Send conditional letter of acceptance email
      await sendConditionalLetterOfAcceptanceEmail(application, student);

      // Create note for approval
      await db.note.create({
        data: {
          content:
            "Application approved. Sent approval email and conditional letter of acceptance",
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

    return { success: "Successfully updated status!" };
  } else {
    await updateStatusEmail(status, application, student, "", emailMsg);
  }

  // Create note
  await db.note.create({
    data: {
      content: `Changed status of application to ${getDisplayStatus(status)}`,
      type: "Admin",
      applicationID: application.id,
      userID: currentAdmin.id,
    },
  });

  return { success: "Successfully updated status!" };
};
