require("dotenv").config();
const { PrismaClient } = require("clc-db");

const db = new PrismaClient();

// async function main() {
//   try {
//     console.log("Seeding database...");
//     const coursesWithDates = await db.course.findMany({
//       where: {
//         startDate: { not: null },
//         last_join_date: { not: null },
//         endDate: { not: null },
//         resultsDate: { not: null },
//       },
//     });

//     for (const course of coursesWithDates) {
//       if (
//         course.startDate &&
//         course.endDate &&
//         course.last_join_date &&
//         course.resultsDate
//       ) {
//         await db.courseInstance.create({
//           data: {
//             course_id: course.id,
//             instance_name: "September 2024",
//             start_date: course.startDate,
//             last_join_date: course.last_join_date,
//             results_date: course.resultsDate,
//             end_date: course.endDate,
//             status: checkIsActive(course.last_join_date),
//           },
//         });
//       }
//     }
//     console.log("Successfully seeded database!");
//   } catch (error) {
//     console.error("[ERROR_SEEDING_DB]", error);
//     return;
//   } finally {
//     await db.$disconnect();
//   }
// }

// main();
