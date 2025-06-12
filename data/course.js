import { db } from "@/lib/db";

export const getCourseByID = async (courseID) => {
  try {
    const course = await db.course.findUnique({
      where: {
        id: courseID,
      },
      include: {
        course_study_mode: true,
        modules: true,
        course_instances: true,
      },
    });
    return course;
  } catch (error) {
    console.log("[FETCHING_COURSE_BY_ID_ERROR]", error);
    return null;
  }
};

export const getCourseByTitle = async (courseTitle) => {
  try {
    const course = await db.course.findFirst({
      where: {
        name: courseTitle,
      },
      include: {
        course_study_mode: true,
        modules: true,
      },
    });
    return course;
  } catch (error) {
    console.log("[FETCHING_COURSE_BY_TITLE_ERROR]", error);
    return null;
  }
};

export const getCourses = async () => {
  try {
    return await db.course.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        course_instances: true,
        course_study_mode: true,
      },
    });
  } catch (error) {
    console.log("[FETCHING_COURSES_ERROR]", error);
    return null;
  }
};

export const getActiveCourses = async () => {
  try {
    const courses = await db.course.findMany({
      where: {
        status: "Active",
      },
      select: {
        id: true,
        name: true,
        course_study_mode: true,
        course_instances: {
          select: {
            instance_name: true,
            start_date: true,
            end_date: true,
          },
        },
        awarding_body: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter out courses with expired dates unless they have an On Demand instance
    return courses.filter((course) => {
      const hasOnDemandInstance = course.course_instances.some(
        (instance) => instance.instance_name === "On Demand"
      );

      if (hasOnDemandInstance) {
        return true; // Always include On Demand courses
      }

      // For non-On Demand courses, check if any instance is still active
      return course.course_instances.some((instance) => {
        const endDate = new Date(instance.end_date);
        return endDate > new Date();
      });
    });
  } catch (error) {
    console.log("[FETCHING_ACTIVE_COURSES_ERROR]", error);
    return null;
  }
};

export const getInstituteByCourseTitle = async (courseTitle) => {
  try {
    return await db.course.findFirst({
      where: {
        name: courseTitle,
      },
      select: {
        awarding_body: true
      }
    })
  } catch (error) {
    console.log("[FETCHING_INSTITUTE_BY_COURSE_TITLE_ERROR]", error);
    return null;
  }
}
