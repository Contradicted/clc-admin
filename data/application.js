import { db } from "@/lib/db";

export const getApplicationByID = async (applicationID) => {
  const application = await db.application.findFirst({
    where: {
      id: applicationID,
    },
    include: {
      qualifications: true,
      pendingQualifications: true,
      workExperience: true,
      notes: {
        include: {
          user: true,
        },
      },
      interview: {
        include: {
          questions: true,
          files: true,
        },
      },
      course: {
        include: {
          course_study_mode: true,
        },
      },
    },
  });

  return application;
};
