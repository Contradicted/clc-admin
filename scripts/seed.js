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

async function updateSLCApplications() {
  try {
    console.log("Finding applications that need to create payment plans...");

    const applications = await db.application.findMany({
      where: {
        tuitionFees: "Student Loan Company England (SLC)",
        paymentPlan: null,
        status: {
          notIn: [
            "Waiting_for_Change",
            "Rejected",
            "Approved",
            "Approved_for_Interview",
            "Interview_successful",
          ],
        },
      },
    });

    console.log(`Found ${applications.length} applications:`);
    applications.forEach((app) =>
      console.log(`ID: ${app.id}, Status: ${app.status}`)
    );

    // Request change for each application found
    // for (const application of applications) {
    //   try {
    //     const emailMsg =
    //       "Please complete additional Student Loan Company questions.";

    //     const student = await db.user.findUnique({
    //       where: {
    //         id: application.userID,
    //       },
    //     });

    //     try {
    //       // Update application status
    //       await db.application.update({
    //         where: {
    //           id: application.id,
    //         },
    //         data: {
    //           status: "Waiting_for_Change",
    //         },
    //       });
    //       console.log(`Updated status for application ${application.id}`);

    //       // Generate token and send email
    //       const updateApplicationToken = await generateUpdateApplicationToken(
    //         student.email,
    //         application.id
    //       );
    //       console.log(`Generated token for application ${application.id}`);

    //       console.log("Sending email...");
    //       await updateStatusEmail(
    //         student,
    //         updateApplicationToken.token,
    //         emailMsg
    //       );
    //       console.log(`Sent email for application ${application.id}`);

    //       await db.note.create({
    //         data: {
    //           content: `Application requested for change. ${emailMsg ? `Message: ${emailMsg}` : ""}`,
    //           type: "Admin",
    //           applicationID: application.id,
    //           userID: 1656991,
    //         },
    //       });
    //       console.log(`Created note for application ${application.id}`);

    //       // await updateStatus(emailMsg, application.id, "Waiting_for_Change");
    //       console.log(`Updated application ${application.id}`);
    //     } catch (error) {
    //       console.error(
    //         `Error processing application ${application.id}:`,
    //         error
    //       );
    //     }
    //   } catch (error) {
    //     console.error(`Failed to update application ${application.id}:`, error);
    //   }
    // }
  } catch (error) {
    console.error("Error updating applications", error);
  } finally {
    await db.$disconnect();
  }
}

updateSLCApplications();
