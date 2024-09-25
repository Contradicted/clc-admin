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
      },
    });
    return course;
  } catch (error) {
    console.log("[FETCHING_COURSE_BY_ID_ERROR]", error);
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
