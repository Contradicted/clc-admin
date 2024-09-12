"use server";

import { getCourseByID } from "@/data/course";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseSchema } from "@/schemas";

export const courses = async (values, courseID) => {
  try {
    const user = await currentUser();
    const isAdmin = user.role === "Admin";

    if (!user || !isAdmin) {
      return { error: "Unauthorised" };
    }

    const { name, code, studyModes, ...rest } = values;

    if (courseID) {
      const existingCourse = await getCourseByID(courseID);

      if (!existingCourse) {
        return { error: "Course not found!" };
      }

      if (existingCourse) {
        // Handle Delete Course
        if (values.delete) {
          await db.course.delete({
            where: {
              id: courseID,
            },
          });

          return { success: "Successfully deleted course!" };
        }

        // Handle status update
        if (values.status) {
          await db.course.update({
            where: {
              id: courseID,
            },
            data: {
              status: values.status,
            },
          });

          return { success: `Course status updated to ${values.status}!` };
        }

        await db.course.update({
          where: {
            id: courseID,
          },
          data: {
            ...rest,
          },
        });

        // Update or create study modes
        if (studyModes) {
          for (const mode of studyModes) {
            await db.courseStudyMode.upsert({
              where: {
                course_id_study_mode: {
                  course_id: courseID,
                  study_mode: mode.study_mode,
                },
              },
              update: {
                tuition_fees: mode.tuition_fees,
                duration: mode.duration,
                study_mode: mode.study_mode,
              },
              create: {
                course_id: courseID,
                study_mode: mode.study_mode,
                duration: mode.duration,
                tuition_fees: mode.tuition_fees,
              },
            });
          }

          // Delete study modes
          await db.courseStudyMode.deleteMany({
            where: {
              course_id: courseID,
              study_mode: { notIn: studyModes.map((mode) => mode.study_mode) },
            },
          });
        }

        return { success: "Successfully updated course!" };
      }
    }

    const course = await db.course.create({
      data: {
        name,
        code,
      },
    });

    return { success: "Successfully created course!", courseId: course.id };
  } catch (error) {
    console.log("[COURSES]", error);
    return { error: "Internal Server Error" };
  }
};
