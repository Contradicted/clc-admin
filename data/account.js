import { db } from "@/lib/db";

export const getAccountById = async (userId) => {
  try {
    const account = await db.account.findFirst({
      where: { userId },
    });

    return account;
  } catch {
    return null;
  }
};
