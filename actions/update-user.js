"use server";

import bcrypt from "bcryptjs";

import { getUserByEmail } from "@/data/student";
import { UpdateUserSchema } from "@/schemas";
import { db } from "@/lib/db";

export const updateUser = async (values) => {
  const validatedFields = UpdateUserSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, firstName, lastName, password } = validatedFields.data;

  const existingUser = await getUserByEmail(values.email);

  if (!existingUser) {
    return { error: "User doesn't exist!" };
  }

  if (!password) {
    await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        title,
        firstName,
        lastName,
      },
    });

    return { success: "User updated successfully!" };
  }

  // Check if password is the same as the current password
  const isPasswordSame = await bcrypt.compare(password, existingUser.password);

  if (isPasswordSame) {
    return {
      error: "New password cannot be the same as the current password!",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      title,
      firstName,
      lastName,
      password: hashedPassword,
    },
  });

  return { success: "User updated successfully!" };
};
