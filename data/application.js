import { db } from "@/lib/db";

export const getApplicationByID = async (applicationID) => {
  const application = await db.application.findFirst({
    where: {
      id: applicationID,
    },
  });

  return application;
};
