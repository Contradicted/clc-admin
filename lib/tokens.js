import { getUpdateApplicationTokenByEmail } from "@/data/update-application-token";
import { nanoid } from "nanoid";
import { db } from "./db";

export const generateUpdateApplicationToken = async (email, applicationID) => {
  const token = nanoid();
  const expires = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000); // Expire after 2 weeks

  const existingToken = await getUpdateApplicationTokenByEmail(email);

  if (existingToken) {
    await db.updateApplicationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const updateApplicationToken = await db.updateApplicationToken.create({
    data: {
      email,
      expires,
      token,
      applicationID,
    },
  });

  return updateApplicationToken;
};
