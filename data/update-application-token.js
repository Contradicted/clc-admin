import { db } from "@/lib/db";

export const getUpdateApplicationTokenByEmail = async (email) => {
  try {
    const updateApplicationToken = await db.updateApplicationToken.findFirst({
      where: { email },
    });

    return updateApplicationToken;
  } catch {
    return null;
  }
};
