"use server";

import { getApplicationByID } from "@/data/application";
import { getStudentByID } from "@/data/student";
import { db } from "@/lib/db";
import { updateStatusEmail } from "@/lib/mail";
import { generateUpdateApplicationToken } from "@/lib/tokens";

export const updateStatus = async (status, applicationID) => {
  const application = await getApplicationByID(applicationID);
  const student = await getStudentByID(application.userID);

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

  if (status === "Waiting_For_Change") {
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

  await updateStatusEmail(status, application, student);

  return { success: "Successfully updated status!" };
};
