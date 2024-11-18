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
          course_instances: true,
        },
      },
      paymentPlan: true,
    },
  });

  return application;
};

export const getApplicationsByStatus = async (status) => {
  try {
    const applications = await db.application.findMany({
      where: {
        status,
      },
    });

    return applications;
  } catch (error) {
    console.error("[FETCHING_APPLICATIONS_BY_STATUS_ERROR]", error);
    return [];
  }
};

export const getDashboardStats = async () => {
  try {
    const statuses = [
      "Submitted",
      "Rejected",
      "Approved",
      "Waiting_for_Change",
      "Re_Submitted",
    ];
    const courses = await db.course.findMany({
      where: {
        status: "Active",
      },
    });

    const courseStats = await Promise.all(
      statuses.map(async (status) => {
        const applications = await getApplicationsByStatus(status);
        const totalCount = applications.length;

        const courseCount = courses.map((course) => ({
          courseTitle: course.name,
          count: applications.filter((app) => app.courseID === course.id)
            .length,
        }));

        return {
          status,
          totalCount,
          courses: courseCount,
        };
      })
    );

    return courseStats;
  } catch (error) {
    console.error("[FETCHING_DASHBOARD_STATS]", error);
    return [];
  }
};
