import { db } from "@/lib/db";

export const getInterviewByApplicationID = async (applicationID) => {
  try {
    const interview = await db.applicationInterview.findFirst({
      where: {
        applicationID,
      },
    });

    return interview;
  } catch {
    return null;
  }
};

export const getInterviewByInterviewID = async (interviewID) => {
  try {
    const interview = await db.applicationInterview.findUnique({
      where: {
        id: interviewID,
      },
      include: {
        files: true,
      },
    });

    return interview;
  } catch (error) {
    console.log("[FETCHING_INTERVIEW_ERROR]", error);
    return null;
  }
};

export const getInterviewFilesByInterviewID = async (interviewID) => {
  try {
    const interviewFiles = await db.interviewFiles.findMany({
      where: {
        id: interviewID,
      },
    });

    return interviewFiles;
  } catch (error) {
    console.log("[FETCHING_INTERVIEW_FILES_ERROR]", error);
    return null;
  }
};
