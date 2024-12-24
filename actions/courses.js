"use server";

import { getCourseByID } from "@/data/course";
import { getModuleByCode } from "@/data/module";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkIsActive } from "@/lib/utils";

export const courses = async (values, courseID) => {
  try {
    const user = await currentUser();
    const isAdmin = user.role === "Admin";

    if (!user || !isAdmin) {
      return { error: "Unauthorised" };
    }

    const { studyModes, course_instances, modules, ...rest } = values;

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

        // Update or create commencements
        if (course_instances) {
          for (const instance of course_instances) {
            const isOnDemand = instance.instance_name === "On Demand";
            await db.courseInstance.upsert({
              where: {
                course_id_instance_name: {
                  course_id: courseID,
                  instance_name: instance.instance_name,
                },
              },
              update: {
                instance_name: instance.instance_name,
                start_date: isOnDemand ? null : instance.start_date,
                last_join_weeks: isOnDemand ? null : instance.last_join_weeks,
                last_join_date: isOnDemand ? null : instance.last_join_date,
                end_date: isOnDemand ? null : instance.end_date,
                results_date: isOnDemand ? null : instance.results_date,
                status: true, // -> For now, all with be active, later it will be 'checkIsActive(instance.last_join_date)'
              },
              create: {
                course: {
                  connect: {
                    id: courseID
                  }
                },
                instance_name: instance.instance_name,
                start_date: isOnDemand ? null : instance.start_date,
                last_join_weeks: isOnDemand ? null : instance.last_join_weeks,
                last_join_date: isOnDemand ? null : instance.last_join_date,
                end_date: isOnDemand ? null : instance.end_date,
                results_date: isOnDemand ? null : instance.results_date,
                status: true, // -> For now, all with be active, later it will be 'checkIsActive(instance.last_join_date)'
              },
            });
          }

          // Delete course instances
          await db.courseInstance.deleteMany({
            where: {
              course_id: courseID,
              instance_name: {
                notIn: course_instances.map(
                  (instance) => instance.instance_name
                ),
              },
            },
          });
        }

        // Update or create study modes
        if (studyModes) {
          for (const mode of studyModes) {
            // Store duration as-is, along with its unit
            await db.courseStudyMode.upsert({
              where: {
                course_id_study_mode: {
                  course_id: courseID,
                  study_mode: mode.study_mode,
                },
              },
              update: {
                duration: mode.duration,
                duration_unit: mode.duration_unit,
                tuition_fees: mode.tuition_fees,
                study_mode: mode.study_mode,
              },
              create: {
                course_id: courseID,
                study_mode: mode.study_mode,
                duration: mode.duration,
                duration_unit: mode.duration_unit,
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

        // Update or create modules
        if (modules) {
          for (const m of modules) {
            // Check if this is an existing module for this course
            const existingModule = await db.module.findFirst({
              where: {
                courseID: courseID,
                code: m.code,
              },
            });

            // If it's not an existing module for this course, check if the code exists elsewhere
            if (!existingModule) {
              const moduleWithSameCode = await getModuleByCode(m.code);
              if (
                moduleWithSameCode &&
                moduleWithSameCode.courseID !== courseID
              ) {
                return {
                  error:
                    "Module with this code already exists in another course!",
                };
              }
            }

            const assessmentString = m.assessment
              .map((a) => `${a.type} ${a.percentage}%`)
              .join(", ");

            await db.module.upsert({
              where: {
                courseID: courseID,
                code: m.code,
              },
              update: {
                code: m.code,
                title: m.title,
                credits: parseInt(m.credits),
                assessment: assessmentString,
                term: m.term,
                type: m.type,
              },
              create: {
                courseID: courseID,
                code: m.code,
                title: m.title,
                credits: parseInt(m.credits),
                assessment: assessmentString,
                term: m.term,
                type: m.type,
              },
            });
          }

          // Delete modules
          await db.module.deleteMany({
            where: {
              courseID: courseID,
              code: { notIn: modules.map((m) => m.code) },
            },
          });
        }

        return { success: "Successfully updated course!" };
      }
    }

    const course = await db.course.create({
      data: {
        name: values.name,
        code: values.code,
      },
    });

    return { success: "Successfully created course!", courseId: course.id };
  } catch (error) {
    console.log("[COURSES]", error);
    return { error: "Internal Server Error" };
  }
};
