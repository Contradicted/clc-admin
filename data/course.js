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
    });
  } catch (error) {
    console.log("[FETCHING_COURSES_ERROR]", error);
    return null;
  }
};

export const getActiveCourses = async () => {
  try {
    return await db.course.findMany({
      where: {
        status: "Active",
      },
      select: {
        id: true,
        name: true,
        course_study_mode: true,
        course_instances: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.log("[FETCHING_ACTIVE_COURSES_ERROR]", error);
    return null;
  }
};
