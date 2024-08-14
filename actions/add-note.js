"use server";

import { getUserById } from "@/data/student";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addNoteSchema } from "@/schemas";

export const addNote = async (values, applicationID, type) => {
  const validatedFields = addNoteSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { content } = validatedFields.data;

  const application = await db.application.findUnique({
    where: {
      id: applicationID,
    },
  });

  if (!application) {
    return { error: "Application does not exist!" };
  }

  const user = await currentUser();
  const existingUser = await getUserById(user.id);

  if (!existingUser) {
    return { error: "User doesn't exist!" };
  }

  const isAdmin = existingUser.role === "Admin";

  if (!isAdmin) {
    return { error: "Insufficient Privileges!" };
  }

  await db.note.create({
    data: {
      content,
      type,
      applicationID,
      userID: existingUser.id,
    },
  });
  return { success: "Successfully created note!" };
};
