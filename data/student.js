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

export const getStudentByApplicationID = async (applicationID) => {
  try {
    const student = await db.user.findFirst({
      where: {
        applications: {
          some: {
            id: applicationID,
          },
        },
      },
      include: {
        applications: true,
      },
    });

    return student;
  } catch (error) {
    console.log("Failed to fetch student by application ID", error);
    return [];
  }
};

export const getUserByEmail = async (email) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  } catch {
    return null;
  }
};
