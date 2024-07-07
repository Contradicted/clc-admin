import { db } from "@/lib/db";

export const getStudentByID = async (userID) => {
  try {
    const student = await db.user.findUnique({
      where: {
        id: userID,
      },
      include: {
        applications: true,
      },
    });

    return student;
  } catch (error) {
    console.log("Failed to fetch student data", error);
    return [];
  }
};
