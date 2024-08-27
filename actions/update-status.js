"use server";

import { getApplicationByID } from "@/data/application";
import { getStudentByID, getUserById } from "@/data/student";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateStatusEmail } from "@/lib/mail";
import { generateUpdateApplicationToken } from "@/lib/tokens";

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
    return;
  }

  await db.application.update({
    where: {
      id: application.id,
    },
    data: {
      status,
    },
  });

  if (status === "Waiting_for_Change") {
    const updateApplicationToken = await generateUpdateApplicationToken(
      student.email
    );
    await updateStatusEmail(
      status,
      application,
      student,
      updateApplicationToken.token
    );

    return { success: "Successfully updated status!" };
  }

  await updateStatusEmail(status, application, student, "", emailMsg);

  // Create note
  await db.note.create({
    data: {
      content: `Changed status of application to ${status}`,
      type: "Admin",
      applicationID: application.id,
      userID: currentAdmin.id,
    },
  });

  return { success: "Successfully updated status!" };
};
