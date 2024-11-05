"use server";

import bcrypt from "bcryptjs";

import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/student";
import { db } from "@/lib/db";
import { generateStaffID, generateUserID } from "@/lib/utils";

export const register = async (values) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) return { error: "Invalid fields!" };

  const { firstName, lastName, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // const id = generateUserID();
  const id = generateStaffID();

  await db.user.create({
    data: {
      id,
      title: "Mr",
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "Admin",
    },
  });

  await db.staff.create({
    data: {
      id,
      firstName,
      lastName,
      email,
    },
  });

  return { success: "User has been successfully created!" };
};
