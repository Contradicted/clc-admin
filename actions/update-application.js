"use server";

import { UTApi } from "uploadthing/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

import { getApplicationByID } from "@/data/application";
import { getQualificationByID } from "@/data/qualifications";
import { getCourseByTitle } from "@/data/course";

export const updateQualifications = async (formData, applicationID) => {
  try {
    const user = await currentUser();
    const utapi = new UTApi();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorised" };
    }

    const existingApplication = await getApplicationByID(applicationID);

    if (!existingApplication) {
      return { error: "Application doesn't exist!" };
    }

    // Check before updating if any qualifications need to be deleted
    const existingQualifications = await db.qualification.findMany({
      where: {
        applicationID,
      },
    });

    // Parse FormData
    const qualifications = [];

    for (let i = 0; formData.has(`qualifications[${i}][title]`); i++) {
      const qualification = {
        id: formData.get(`qualifications[${i}][id]`),
        title: formData.get(`qualifications[${i}][title]`),
        examiningBody: formData.get(`qualifications[${i}][examiningBody]`),
        dateAwarded: formData.get(`qualifications[${i}][dateAwarded]`),
      };

      const file = formData.get(`qualifications[${i}][file]`);
      const existingFile = formData.get(`qualifications[${i}][existingFile]`);

      if (file) {
        // Handle new file upload
        qualification.file = file;
      } else if (existingFile) {
        // Handle existing file
        qualification.existingFile = JSON.parse(existingFile);
      }

      qualifications.push(qualification);
    }

    const IDsFromValues = new Set(
      qualifications.map((q) => q.id).filter(Boolean)
    );

    const qualificationsToDelete = existingQualifications.filter(
      (qual) => !IDsFromValues.has(qual.id)
    );

    // Delete associated files
    for (const qual of qualificationsToDelete) {
      if (qual.url) {
        const fileKey = qual.url.split("f/")[1];
        await utapi.deleteFiles(fileKey);
      }
    }

    // Batch delete qualifications
    await db.qualification.deleteMany({
      where: {
        id: {
          in: qualificationsToDelete.map((qual) => qual.id),
        },
      },
    });

    for (const qual of qualifications) {
      if (qual.id) {
        const existingQualification = await getQualificationByID(qual.id);

        if (!existingQualification) {
          return { error: "Qualification doesn't exist!" };
        }

        // Only upload file if it is not already uploaded
        let uploadedFile;

        if (qual.file instanceof File) {
          // Delete existing file if it exists
          if (qual.url) {
            const fileKey = qual.url.split("f/")[1];
            await utapi.deleteFiles(fileKey);
          }

          // Upload new file to uploadThing
          uploadedFile = await utapi.uploadFiles(qual.file);
        } else if (!qual.existingFile && existingQualification.url) {
          // File is deleted
          const fileKey = existingQualification.url.split("f/")[1];
          await utapi.deleteFiles(fileKey);

          uploadedFile = null;
        }

        // Update qualification with updated values
        await db.qualification.update({
          where: {
            id: qual.id,
          },
          data: {
            title: qual.title,
            examiningBody: qual.examiningBody,
            dateAwarded: new Date(qual.dateAwarded),
            url: uploadedFile
              ? uploadedFile.data.url
              : uploadedFile === null
                ? null
                : existingQualification.url,
            fileName: uploadedFile
              ? uploadedFile.data.name
              : uploadedFile === null
                ? null
                : existingQualification.fileName,
          },
        });
      } else {
        let uploadedFile;

        if (qual.file instanceof File) {
          uploadedFile = await utapi.uploadFiles(qual.file);
        }

        await db.qualification.create({
          data: {
            title: qual.title,
            examiningBody: qual.examiningBody,
            dateAwarded: new Date(qual.dateAwarded),
            applicationID,
            url: uploadedFile ? uploadedFile.data.url : null,
            fileName: uploadedFile ? uploadedFile.data.name : null,
          },
        });
      }
    }

    // Handle Pending Qualifications
    const hasPendingResults = formData.get("hasPendingResults") === "yes";

    await db.$transaction(async (db) => {
      // Update application's hasPendingResults
      await db.application.update({
        where: { id: applicationID },
        data: { hasPendingResults },
      });

      if (hasPendingResults) {
        // Get existing pending qualifications
        const existingPendingQuals =
          (await db.pendingQualification.findMany({
            where: { applicationID },
          })) || [];

        const pendingQualifications = [];
        for (
          let i = 0;
          formData.has(`pendingQualifications[${i}][title]`);
          i++
        ) {
          pendingQualifications.push({
            title: formData.get(`pendingQualifications[${i}][title]`),
            examiningBody: formData.get(
              `pendingQualifications[${i}][examiningBody]`
            ),
            dateOfResults: new Date(
              formData.get(`pendingQualifications[${i}][dateOfResults]`)
            ),
            subjectsPassed: formData.get(
              `pendingQualifications[${i}][subjectsPassed]`
            ),
          });
        }

        // Update or create pending qualifications
        for (let i = 0; i < pendingQualifications.length; i++) {
          const pendingQual = pendingQualifications[i];
          if (existingPendingQuals[i]) {
            // Update existing
            await db.pendingQualification.update({
              where: { id: existingPendingQuals[i].id },
              data: pendingQual,
            });
          } else {
            // Create new
            await db.pendingQualification.create({
              data: {
                ...pendingQual,
                applicationID,
              },
            });
          }
        }

        // Delete any extra existing pending qualifications
        if (existingPendingQuals.length > pendingQualifications.length) {
          await db.pendingQualification.deleteMany({
            where: {
              id: {
                in: existingPendingQuals
                  .slice(pendingQualifications.length)
                  .map((q) => q.id),
              },
            },
          });
        }
      } else {
        // Delete all pending qualifications if hasPendingResults is false
        await db.pendingQualification.deleteMany({
          where: { applicationID },
        });
      }
    });

    return { success: "Qualifications updated successfully!" };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong" };
  }
};

export const updateWorkExperience = async (formData, applicationID) => {
  try {
    const user = await currentUser();
    const utapi = new UTApi();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorised" };
    }

    const existingApplication = await getApplicationByID(applicationID);

    if (!existingApplication) {
      return { error: "Application doesn't exist!" };
    }

    const hasWorkExperience = formData.get("hasWorkExperience") === "yes";

    await db.$transaction(
      async (db) => {
        // Update application's hasWorkExperience
        await db.application.update({
          where: {
            id: applicationID,
          },
          data: {
            hasWorkExperience,
          },
        });
        if (hasWorkExperience) {
          const existingWorkExperiences = await db.workExperience.findMany({
            where: { applicationID },
          });

          const workExperiences = [];
          for (let i = 0; formData.has(`workExperience[${i}][title]`); i++) {
            const workExperience = {
              title: formData.get(`workExperience[${i}][title]`),
              nameOfOrganisation: formData.get(
                `workExperience[${i}][nameOfOrganisation]`
              ),
              natureOfJob: formData.get(`workExperience[${i}][natureOfJob]`),
              jobStartDate: formData.get(`workExperience[${i}][jobStartDate]`),
              jobEndDate: formData.get(`workExperience[${i}][jobEndDate]`),
            };

            if (formData.has(`workExperience[${i}][id]`)) {
              workExperience.id = formData.get(`workExperience[${i}][id]`);
            }

            const file = formData.get(`workExperience[${i}][file]`);
            const existingFile = formData.get(
              `workExperience[${i}][existingFile]`
            );

            if (file) {
              workExperience.file = file;
            } else if (existingFile) {
              workExperience.existingFile = JSON.parse(existingFile);
            }

            workExperiences.push(workExperience);
          }

          // Update or create work experience records
          for (const workExperience of workExperiences) {
            let uploadedFile;

            if (workExperience.id) {
              const existingWorkExperience = await db.workExperience.findUnique(
                {
                  where: { id: workExperience.id },
                }
              );

              if (!existingWorkExperience) {
                return { error: "Work experience doesn't exist!" };
              }

              if (workExperience.file instanceof File) {
                // Delete existing file if it exists
                if (existingWorkExperience.url) {
                  const fileKey = existingWorkExperience.url.split("f/")[1];
                  await utapi.deleteFiles(fileKey);
                }

                // Upload new file to uploadThing
                uploadedFile = await utapi.uploadFiles(workExperience.file);
              } else if (
                !workExperience.existingFile &&
                existingWorkExperience.url
              ) {
                // File is deleted
                const fileKey = existingWorkExperience.url.split("f/")[1];
                await utapi.deleteFiles(fileKey);

                uploadedFile = null;
              }

              // Update work experience with updated values
              await db.workExperience.update({
                where: { id: workExperience.id },
                data: {
                  title: workExperience.title,
                  nameOfOrganisation: workExperience.nameOfOrganisation,
                  natureOfJob: workExperience.natureOfJob,
                  jobStartDate: new Date(workExperience.jobStartDate),
                  jobEndDate: new Date(workExperience.jobEndDate),
                  url: uploadedFile
                    ? uploadedFile.data.url
                    : uploadedFile === null
                      ? null
                      : existingWorkExperience.url,
                  fileName: uploadedFile
                    ? uploadedFile.data.name
                    : uploadedFile === null
                      ? null
                      : existingWorkExperience.fileName,
                },
              });
            } else {
              if (workExperience.file instanceof File) {
                uploadedFile = await utapi.uploadFiles(workExperience.file);
              }

              // Create new work experience record
              await db.workExperience.create({
                data: {
                  title: workExperience.title,
                  nameOfOrganisation: workExperience.nameOfOrganisation,
                  natureOfJob: workExperience.natureOfJob,
                  jobStartDate: new Date(workExperience.jobStartDate),
                  jobEndDate: new Date(workExperience.jobEndDate),
                  applicationID,
                  url: uploadedFile ? uploadedFile.data.url : null,
                  fileName: uploadedFile ? uploadedFile.data.name : null,
                },
              });
            }
          }

          // Delete any removed work experiences from db
          if (existingWorkExperiences.length > workExperiences.length) {
            // Find work experiences to delete
            const workExperiencesToDelete = existingWorkExperiences.slice(
              workExperiences.length
            );

            // Delete files from uploadthing
            for (const we of workExperiencesToDelete) {
              if (we.url) {
                const fileKey = we.url.split("f/")[1];
                await utapi.deleteFiles(fileKey);
              }
            }

            // Delete work experiences from the database
            await db.workExperience.deleteMany({
              where: {
                id: {
                  in: workExperiencesToDelete.map((we) => we.id),
                },
              },
            });
          }
        } else {
          // If hasWorkExperience is false, delete all work experiences with files
          const workExperiencesToDelete = await db.workExperience.findMany({
            where: {
              applicationID,
            },
          });

          // Delete files from uploadthing
          for (const we of workExperiencesToDelete) {
            if (we.url) {
              const fileKey = we.url.split("f/")[1];
              await utapi.deleteFiles(fileKey);
            }
          }

          // Delete all work experiences from the database
          await db.workExperience.deleteMany({
            where: { applicationID },
          });
        }
      },
      {
        timeout: 12000, // 2 mins timeout
      }
    );

    return { success: "Work Experiences updated successfully!" };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong" };
  }
};

export const updateAdditionalInfo = async (values, applicationID) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorised" };
    }

    const existingApplication = await getApplicationByID(applicationID);

    if (!existingApplication) {
      return { error: "Application doesn't exist!" };
    }

    await db.application.update({
      where: {
        id: existingApplication.id,
      },
      data: {
        ...values,
      },
    });

    return { success: "Additional information updated successfully!" };
  } catch (error) {
    console.error("[UPDATING_ADDT_INFO_ERROR]", error);
    return { error: "Something went wrong" };
  }
};

export const updatePersonalDetails = async (formData, applicationID) => {
  try {
    const user = await currentUser();
    const utapi = new UTApi();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorised" };
    }

    const existingApplication = await getApplicationByID(applicationID);

    if (!existingApplication) {
      return { error: "Application doesn't exist!" };
    }

    const personalDetails = {
      title: formData.get("title"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gender: formData.get("gender"),
      dateOfBirth: new Date(formData.get("dateOfBirth")),
      placeOfBirth: formData.get("placeOfBirth"),
      countryOfBirth: formData.get("countryOfBirth"),
      identificationNo: formData.get("identificationNo"),
      nationality: formData.get("nationality"),
      addressLine1: formData.get("addressLine1"),
      addressLine2:
        formData.get("addressLine2") !== "undefined"
          ? formData.get("addressLine2")
          : null,
      city: formData.get("city"),
      postcode: formData.get("postcode"),
      email: formData.get("email"),
      mobileNo: formData.get("mobileNo"),
      homeTelephoneNo: formData.get("homeTelephoneNo"),
      emergency_contact_name: formData.get("emergency_contact_name"),
      emergency_contact_no: formData.get("emergency_contact_no"),
      tuitionFees: formData.get("tuitionFees"),
      isEnglishFirstLanguage: formData.get("isEnglishFirstLanguage") === "true",
      entryDateToUK:
        formData.get("entryDateToUK") !== "undefined"
          ? new Date(formData.get("entryDateToUK"))
          : null,
      immigration_status:
        formData.get("immigration_status") !== "undefined"
          ? formData.get("immigration_status")
          : null,
      share_code:
        formData.get("share_code") !== "undefined"
          ? formData.get("share_code")
          : null,
    };

    const fileTypes = [
      { formName: "photo", urlField: "photoUrl", nameField: "photoName" },
      {
        formName: "identification",
        urlField: "identificationNoUrl",
        nameField: null,
      },
      {
        formName: "immigration",
        urlField: "immigration_url",
        nameField: "immigration_name",
      },
    ];

    for (const { formName, urlField, nameField } of fileTypes) {
      const file = formData.get(`${formName}File`);
      const existingFile = formData.get(`${formName}ExistingFile`);

      if (file instanceof File) {
        // Delete existing file if it exists
        if (existingApplication[urlField]) {
          const fileKey = existingApplication[urlField].split("f/")[1];
          await utapi.deleteFiles(fileKey);
        }

        // Upload new file
        const uploadedFile = await utapi.uploadFiles(file);
        personalDetails[urlField] = uploadedFile.data.url;
        if (nameField) personalDetails[nameField] = uploadedFile.data.name;
      } else if (existingFile) {
        // Keep existing file
        const parsedFile = JSON.parse(existingFile);
        personalDetails[urlField] = parsedFile.url;
        if (nameField) personalDetails[nameField] = parsedFile.name;
      } else {
        // Remove file
        if (existingApplication[urlField]) {
          const fileKey = existingApplication[urlField].split("f/")[1];
          await utapi.deleteFiles(fileKey);
        }
        personalDetails[urlField] = null;
        if (nameField) personalDetails[nameField] = null;
      }
    }

    await db.application.update({
      where: { id: existingApplication.id },
      data: personalDetails,
    });

    return { success: "Personal Details updated successfully!" };
  } catch (error) {
    console.error("[UPDATING_PERSONAL_DETAILS_ERROR]", error);
    return { error: "Something went wrong" };
  }
};

export const updateCourseDetails = async (values, applicationID) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorised" };
    }

    const existingApplication = await getApplicationByID(applicationID);

    if (!existingApplication) {
      return { error: "Application doesn't exist!" };
    }

    const existingCourse = await getCourseByTitle(values.courseTitle);

    if (!existingCourse) {
      return { error: "Course doesn't exist!" };
    }

    // Check if the study mode is valid for this course
    const validStudyModes = existingCourse.course_study_mode.map(
      (mode) => mode.study_mode
    );
    if (!validStudyModes.includes(values.studyMode)) {
      return { error: "Invalid study mode for this course" };
    }

    // Check if the course is actually changing
    if (
      existingApplication.courseID === existingCourse.id &&
      existingApplication.studyMode === values.studyMode &&
      existingApplication.campus === values.campus &&
      existingApplication.commencement === values.commencement
    ) {
      return;
    }

    await db.application.update({
      where: { id: existingApplication.id },
      data: {
        courseID: existingCourse.id,
        ...values,
      },
    });

    return { success: "Course details updated successfully" };
  } catch (error) {
    console.error("[UPDATING_COURSE_DETAILS_ERROR]", error);
    return { error: "Something went wrong" };
  }
};

export const updatePaymentPlan = async (values, applicationID) => {
  try {
    const utapi = new UTApi();

    const paymentPlanData = {
      paymentOption: "SLC",
      hasSlcAccount: values.get("hasSlcAccount") === "Yes",
      previouslyReceivedFunds: values.get("previouslyReceivedFunds") === "Yes",
      previousFundingYear:
        values.get("previousFundingYear") !== "undefined"
          ? values.get("previousFundingYear")
          : null,
      appliedForCourse: values.get("appliedForCourse") === "Yes",
      crn: values.get("crn") || null,
      slcStatus: values.get("slcStatus") || null,
      ssn: values.get("ssn") || null,
      tuitionFeeAmount: !isNaN(values.get("tuitionFeeAmount"))
        ? Number(values.get("tuitionFeeAmount"))
        : null,
      maintenanceLoanAmount: !isNaN(values.get("maintenanceLoanAmount"))
        ? Number(values.get("maintenanceLoanAmount"))
        : null,
      courseFee: values.get("courseFee")
        ? Number(values.get("courseFee"))
        : null,
      usingMaintenanceForTuition:
        values.get("usingMaintenanceForTuition") === "true" || null,
      expectedPayments: JSON.parse(values.get("expectedPayments") || []),
      shortfall: JSON.parse(values.get("shortfall") || null),
      paymentStatus: JSON.parse(values.get("paymentStatus") || null),
    };

    // Handle document upload
    const file = values.get("tuition_doc");
    const existingFile = values.get("tuition_doc_existing");

    let fileData = {};

    if (file && file instanceof File) {
      // Check if a file is already present in the DB
      const existingTuitionDoc = await db.application.findUnique({
        where: {
          id: applicationID,
        },
        select: { tuition_doc_url: true },
      });

      // If file already exists, delete and replace
      if (existingTuitionDoc?.tuition_doc_url) {
        const fileKey = existingTuitionDoc.tuition_doc_url.split("f/")[1];
        await utapi.deleteFiles([fileKey]);
      }

      const uploadedFile = await utapi.uploadFiles(file);
      fileData = {
        tuition_doc_url: uploadedFile.data.url,
        tuition_doc_name: uploadedFile.data.name,
      };
    } else if (!existingFile) {
      // Remove file
      const existingDoc = await db.application.findUnique({
        where: { id: applicationID },
        select: { tuition_doc_url: true },
      });

      if (existingDoc?.tuition_doc_url) {
        const fileKey = existingDoc.tuition_doc_url.split("f/")[1];
        await utapi.deleteFiles([fileKey]);
      }
      fileData = {
        tuition_doc_url: null,
        tuition_doc_name: null,
      };
    }

    // Create transaction
    const transactions = [
      db.paymentPlan.upsert({
        where: { applicationID },
        create: { applicationID, ...paymentPlanData },
        update: paymentPlanData,
      }),
    ];

    // Only update application if file has changed
    if (fileData) {
      transactions.push(
        db.application.update({
          where: { id: applicationID },
          data: fileData,
        })
      );
    }

    await db.$transaction(transactions);
    return { success: "Student finance details updated successfully" };
  } catch (error) {
    console.error("[UPDATING_PAYMENT_PLAN_ERROR]", error);
    return { error: "Something went wrong" };
  }
};
