import { db } from "@/lib/db";

export const getQualificationByID = async (qualificationID) => {
  try {
    const qualification = await db.qualification.findUnique({
      where: {
        id: qualificationID,
      },
    });

    return qualification;
  } catch (error) {
    console.log("[GET_QUALIFICATION_BY_ID] error: ", error);
    return null;
  }
};
