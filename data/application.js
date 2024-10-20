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

export const getDashboardApplications = async () => {
  try {
    const applications = await db.application.findMany();

    const submitted = applications.filter((app) => app.status === "Submitted");
    const approved = applications.filter((app) => app.status === "Approved");
    const rejected = applications.filter((app) => app.status === "Rejected");
    const revision = applications.filter(
      (app) => app.status === "Waiting_for_Change"
    );

    return {
      submitted,
      approved,
      rejected,
      revision,
    };
  } catch (error) {
    console.error("[FETCHING_DASHBOARD_APPLICATIONS]", error);
    return {
      submitted: [],
      approved: [],
      rejected: [],
      revision: [],
    };
  }
};
