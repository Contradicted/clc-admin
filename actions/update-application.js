"use server";

import { UTApi } from "uploadthing/server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

import { getApplicationByID } from "@/data/application";
import { getQualificationByID } from "@/data/qualifications";
import { getCourseByTitle } from "@/data/course";
import { logActivity, logChanges } from "./activity-log";

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

    // Get existing pending qualifications
    const existingPendingQuals = await db.pendingQualification.findMany({
      where: { applicationID },
    });

    // Create oldData object for audit logging
    const oldData = {
      hasPendingResults: existingApplication.hasPendingResults,
      qualifications: existingQualifications.map((qual) => ({
        id: qual.id,
        title: qual.title,
        examiningBody: qual.examiningBody,
        dateAwarded: qual.dateAwarded,
        learnerRef: qual.learnerRef,
        certificateRef: qual.certificateRef,
        url: qual.url,
        fileName: qual.fileName,
      })),
      pendingQualifications: existingPendingQuals.map((pq) => ({
        id: pq.id,
        title: pq.title,
        examiningBody: pq.examiningBody,
        dateOfResults: pq.dateOfResults,
        subjectsPassed: pq.subjectsPassed,
      })),
    };

    // Create newData object to track changes
    const newData = {
      hasPendingResults: formData.get("hasPendingResults") === "yes",
    };

    // Parse FormData
    const qualifications = [];

    for (let i = 0; formData.has(`qualifications[${i}][title]`); i++) {
      const qualification = {
        id: formData.get(`qualifications[${i}][id]`),
        title: formData.get(`qualifications[${i}][title]`),
        examiningBody: formData.get(`qualifications[${i}][examiningBody]`),
        dateAwarded: formData.get(`qualifications[${i}][dateAwarded]`),
        learnerRef: formData.get(`qualifications[${i}][learnerRef]`),
        certificateRef: formData.get(`qualifications[${i}][certificateRef]`),
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

        // Log the file deletion with DELETE_FILE action type
        await logActivity(user.id, applicationID, "DELETE_FILE", {
          field: `qualification.${qual.title}.file`,
          prevValue: qual.fileName || qual.url,
          newValue: null,
        });
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

        if (qual.file) {
          // Delete existing file if it exists
          if (qual.url) {
            const fileKey = qual.url.split("f/")[1];
            await utapi.deleteFiles(fileKey);
          }

          // Upload new file to uploadThing
          uploadedFile = await utapi.uploadFiles(qual.file);

          // Log the file upload with ADD_FILE action type
          await logActivity(user.id, applicationID, "ADD_FILE", {
            field: `qualification.${qual.title}.file`,
            prevValue: null,
            newValue: uploadedFile.data.name || uploadedFile.data.url,
          });
        } else if (!qual.existingFile && existingQualification.url) {
          // File is deleted
          const fileKey = existingQualification.url.split("f/")[1];
          await utapi.deleteFiles(fileKey);

          // Log the file deletion with DELETE_FILE action type
          await logActivity(user.id, applicationID, "DELETE_FILE", {
            field: `qualification.${qual.title}.file`,
            prevValue:
              existingQualification.fileName || existingQualification.url,
            newValue: null,
          });

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
            learnerRef: qual.learnerRef,
            certificateRef: qual.certificateRef,
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

        if (qual.file) {
          uploadedFile = await utapi.uploadFiles(qual.file);

          // Log the file upload with ADD_FILE action type
          await logActivity(user.id, applicationID, "ADD_FILE", {
            field: `qualification.${qual.title}.file`,
            prevValue: null,
            newValue: uploadedFile.data.name || uploadedFile.data.url,
          });
        }

        await db.qualification.create({
          data: {
            title: qual.title,
            examiningBody: qual.examiningBody,
            dateAwarded: new Date(qual.dateAwarded),
            learnerRef: qual.learnerRef,
            certificateRef: qual.certificateRef,
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

    // Add qualifications to newData for audit logging
    newData.qualifications = [];
    for (const qual of qualifications) {
      newData.qualifications.push({
        id: qual.id,
        title: qual.title,
        examiningBody: qual.examiningBody,
        dateAwarded: qual.dateAwarded,
        learnerRef: qual.learnerRef,
        certificateRef: qual.certificateRef,
        url: qual.url,
        fileName: qual.fileName,
      });
    }

    // Add pending qualifications to newData
    if (newData.hasPendingResults) {
      newData.pendingQualifications = [];
      for (let i = 0; formData.has(`pendingQualifications[${i}][title]`); i++) {
        newData.pendingQualifications.push({
          title: formData.get(`pendingQualifications[${i}][title]`),
          examiningBody: formData.get(
            `pendingQualifications[${i}][examiningBody]`
          ),
          dateOfResults: formData.get(
            `pendingQualifications[${i}][dateOfResults]`
          ),
          subjectsPassed: formData.get(
            `pendingQualifications[${i}][subjectsPassed]`
          ),
        });
      }
    }

    // Custom logging for qualifications to handle additions, modifications, and deletions separately
    // First log the hasPendingResults change if it changed
    if (oldData.hasPendingResults !== newData.hasPendingResults) {
      await logActivity(user.id, applicationID, "UPDATE_QUALIFICATIONS", {
        field: "hasPendingResults",
        prevValue: oldData.hasPendingResults,
        newValue: newData.hasPendingResults,
      });
    }

    // Helper function to normalize dates for comparison
    const normalizeDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        // Convert to YYYY-MM-DD format for consistent comparison
        const date = new Date(dateValue);
        return date.toISOString().split("T")[0];
      } catch (e) {
        return dateValue;
      }
    };

    // Helper function to create a clean object for audit logs
    const cleanQualificationForLog = (qual) => {
      if (!qual) return null;
      return {
        title: qual.title,
        examiningBody: qual.examiningBody,
        dateAwarded: normalizeDate(qual.dateAwarded),
        learnerRef: qual.learnerRef,
        certificateRef: qual.certificateRef || "",
      };
    };

    // Handle qualifications changes
    // 1. Separate qualifications with IDs from those without
    const qualificationsWithIds = newData.qualifications.filter(
      (q) => q.id && q.id.trim() !== ""
    );
    const qualificationsWithoutIds = newData.qualifications.filter(
      (q) => !q.id || q.id.trim() === ""
    );

    // 2. Create maps for easier lookup
    const oldQualMap = new Map(oldData.qualifications.map((q) => [q.id, q]));
    const newQualMap = new Map(qualificationsWithIds.map((q) => [q.id, q]));

    // 3. Find added qualifications (those without IDs or with IDs not in old data)
    const addedQuals = [
      ...qualificationsWithoutIds,
      ...qualificationsWithIds.filter((q) => !oldQualMap.has(q.id)),
    ];

    // 4. Find deleted qualifications (in old but not in new)
    const deletedQuals = oldData.qualifications.filter(
      (q) => !newQualMap.has(q.id)
    );

    // 5. Track if any existing qualifications were modified
    let hasModifiedQualifications = false;

    // 6. Process only qualifications that exist in both old and new data
    const commonQualIds = [...oldQualMap.keys()].filter((id) =>
      newQualMap.has(id)
    );

    // Log additions first
    for (const addedQual of addedQuals) {
      await logActivity(user.id, applicationID, "ADD_QUALIFICATION", {
        field: `qualification.${addedQual.title}`,
        prevValue: null,
        newValue: cleanQualificationForLog(addedQual),
      });
    }

    // Check for modifications in existing qualifications
    for (const id of commonQualIds) {
      const oldQual = oldQualMap.get(id);
      const newQual = newQualMap.get(id);

      // Normalize dates for comparison
      const normalizedOldQual = {
        ...oldQual,
        dateAwarded: normalizeDate(oldQual.dateAwarded),
      };
      const normalizedNewQual = {
        ...newQual,
        dateAwarded: normalizeDate(newQual.dateAwarded),
      };

      // Compare important fields
      const hasChanged =
        normalizedOldQual.title !== normalizedNewQual.title ||
        normalizedOldQual.examiningBody !== normalizedNewQual.examiningBody ||
        normalizedOldQual.dateAwarded !== normalizedNewQual.dateAwarded ||
        normalizedOldQual.learnerRef !== normalizedNewQual.learnerRef ||
        normalizedOldQual.certificateRef !== normalizedNewQual.certificateRef;

      if (hasChanged) {
        hasModifiedQualifications = true;
        await logActivity(user.id, applicationID, "UPDATE_QUALIFICATIONS", {
          field: `qualification.${newQual.title}`,
          prevValue: cleanQualificationForLog(oldQual),
          newValue: cleanQualificationForLog(newQual),
        });
      }
    }

    // Log deleted qualifications
    for (const deletedQual of deletedQuals) {
      await logActivity(user.id, applicationID, "DELETE_QUALIFICATIONS", {
        field: `qualification.${deletedQual.title}`,
        prevValue: cleanQualificationForLog(deletedQual),
        newValue: null,
      });
    }

    // Note: We've already logged the individual additions and modifications above

    // Helper function to clean pending qualification for logs
    const cleanPendingQualForLog = (qual) => {
      if (!qual) return null;
      return {
        title: qual.title,
        examiningBody: qual.examiningBody,
        dateOfResults: normalizeDate(qual.dateOfResults),
        subjectsPassed: qual.subjectsPassed || "",
      };
    };

    // Handle pending qualifications similarly if hasPendingResults is true
    if (newData.hasPendingResults && oldData.hasPendingResults) {
      // 1. Separate pending qualifications with IDs from those without
      const pendingWithIds = newData.pendingQualifications.filter(
        (q) => q.id && q.id.trim() !== ""
      );
      const pendingWithoutIds = newData.pendingQualifications.filter(
        (q) => !q.id || q.id.trim() === ""
      );

      // 2. Create maps for easier lookup
      const oldPendingMap = new Map(
        oldData.pendingQualifications.map((q) => [q.id, q])
      );
      const newPendingMap = new Map(pendingWithIds.map((q) => [q.id, q]));

      // 3. Find added pending qualifications
      const addedPending = [
        ...pendingWithoutIds,
        ...pendingWithIds.filter((q) => !oldPendingMap.has(q.id)),
      ];

      // 4. Find deleted pending qualifications
      const deletedPending = oldData.pendingQualifications.filter(
        (q) => !newPendingMap.has(q.id)
      );

      // 5. Process only pending qualifications that exist in both old and new data
      const commonPendingIds = [...oldPendingMap.keys()].filter((id) =>
        newPendingMap.has(id)
      );

      // Log additions first
      for (const added of addedPending) {
        await logActivity(user.id, applicationID, "ADD_PENDING_QUALIFICATION", {
          field: `pendingQualification.${added.title}`,
          prevValue: null,
          newValue: cleanPendingQualForLog(added),
        });
      }

      // Check for modifications in existing pending qualifications
      for (const id of commonPendingIds) {
        const oldPending = oldPendingMap.get(id);
        const newPending = newPendingMap.get(id);

        // Normalize dates for comparison
        const normalizedOldPending = {
          ...oldPending,
          dateOfResults: normalizeDate(oldPending.dateOfResults),
        };
        const normalizedNewPending = {
          ...newPending,
          dateOfResults: normalizeDate(newPending.dateOfResults),
        };

        // Compare important fields
        const hasChanged =
          normalizedOldPending.title !== normalizedNewPending.title ||
          normalizedOldPending.examiningBody !==
            normalizedNewPending.examiningBody ||
          normalizedOldPending.dateOfResults !==
            normalizedNewPending.dateOfResults ||
          normalizedOldPending.subjectsPassed !==
            normalizedNewPending.subjectsPassed;

        if (hasChanged) {
          await logActivity(
            user.id,
            applicationID,
            "UPDATE_PENDING_QUALIFICATION",
            {
              field: `pendingQualification.${newPending.title}`,
              prevValue: cleanPendingQualForLog(oldPending),
              newValue: cleanPendingQualForLog(newPending),
            }
          );
        }
      }

      // Log deletions
      for (const deleted of deletedPending) {
        await logActivity(
          user.id,
          applicationID,
          "DELETE_PENDING_QUALIFICATION",
          {
            field: `pendingQualification.${deleted.title}`,
            prevValue: cleanPendingQualForLog(deleted),
            newValue: null,
          }
        );
      }
    } else if (newData.hasPendingResults && !oldData.hasPendingResults) {
      // All pending qualifications are new
      for (const newPending of newData.pendingQualifications) {
        await logActivity(user.id, applicationID, "ADD_PENDING_QUALIFICATION", {
          field: `pendingQualification.${newPending.title}`,
          prevValue: null,
          newValue: cleanPendingQualForLog(newPending),
        });
      }
    } else if (!newData.hasPendingResults && oldData.hasPendingResults) {
      // All pending qualifications were removed
      for (const oldPending of oldData.pendingQualifications) {
        await logActivity(
          user.id,
          applicationID,
          "DELETE_PENDING_QUALIFICATION",
          {
            field: `pendingQualification.${oldPending.title}`,
            prevValue: cleanPendingQualForLog(oldPending),
            newValue: null,
          }
        );
      }
    }

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

    // Get existing data before updating
    const oldData = {
      hasWorkExperience: existingApplication.hasWorkExperience,
    };

    // Get existing work experiences
    const existingWorkExperiences = await db.workExperience.findMany({
      where: { applicationID },
    });

    // Add existing work experiences to oldData for audit logging
    oldData.workExperiences = existingWorkExperiences.map((we) => ({
      id: we.id,
      title: we.title,
      nameOfOrganisation: we.nameOfOrganisation,
      natureOfJob: we.natureOfJob,
      jobStartDate: we.jobStartDate,
      jobEndDate: we.jobEndDate,
      url: we.url,
      fileName: we.fileName,
    }));

    // Create newData object to track changes
    const newData = {
      hasWorkExperience,
    };

    // Parse work experiences from formData for newData
    const newWorkExperiences = [];
    for (let i = 0; formData.has(`workExperience[${i}][title]`); i++) {
      newWorkExperiences.push({
        id: formData.get(`workExperience[${i}][id]`),
        title: formData.get(`workExperience[${i}][title]`),
        nameOfOrganisation: formData.get(
          `workExperience[${i}][nameOfOrganisation]`
        ),
        natureOfJob: formData.get(`workExperience[${i}][natureOfJob]`),
        jobStartDate: formData.get(`workExperience[${i}][jobStartDate]`),
        jobEndDate: formData.get(`workExperience[${i}][jobEndDate]`),
      });
    }
    newData.workExperiences = newWorkExperiences;

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

              if (workExperience.file) {
                // Delete existing file if it exists
                if (existingWorkExperience.url) {
                  const fileKey = existingWorkExperience.url.split("f/")[1];
                  await utapi.deleteFiles(fileKey);

                  // Log the file deletion with DELETE_FILE action type
                  await logActivity(user.id, applicationID, "DELETE_FILE", {
                    field: `workExperience.${workExperience.title}.file`,
                    prevValue:
                      existingWorkExperience.fileName ||
                      existingWorkExperience.url,
                    newValue: null,
                  });
                }

                // Upload new file to uploadThing
                uploadedFile = await utapi.uploadFiles(workExperience.file);

                // Log the file upload with ADD_FILE action type
                await logActivity(user.id, applicationID, "ADD_FILE", {
                  field: `workExperience.${workExperience.title}.file`,
                  prevValue: null,
                  newValue:
                    uploadedFile.data.name ||
                    uploadedFile.data.url.split("/").pop(),
                });
              } else if (
                !workExperience.existingFile &&
                existingWorkExperience.url
              ) {
                // File is deleted
                const fileKey = existingWorkExperience.url.split("f/")[1];
                await utapi.deleteFiles(fileKey);

                // Log the file deletion with DELETE_FILE action type
                await logActivity(user.id, applicationID, "DELETE_FILE", {
                  field: `workExperience.${workExperience.title}.file`,
                  prevValue:
                    existingWorkExperience.fileName ||
                    existingWorkExperience.url,
                  newValue: null,
                });

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
              if (workExperience.file) {
                uploadedFile = await utapi.uploadFiles(workExperience.file);

                // Log the file upload with ADD_FILE action type
                await logActivity(user.id, applicationID, "ADD_FILE", {
                  field: `workExperience.${workExperience.title}.file`,
                  prevValue: null,
                  newValue:
                    uploadedFile.data.name ||
                    uploadedFile.data.url.split("/").pop(),
                });
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

    // Helper functions for work experience audit logging
    const normalizeDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        // Convert to YYYY-MM-DD format for consistent comparison
        const date = new Date(dateValue);
        return date.toISOString().split("T")[0];
      } catch (e) {
        return dateValue;
      }
    };

    // Helper function to create a clean object for work experience audit logs
    const cleanWorkExperienceForLog = (we) => {
      if (!we) return null;
      return {
        title: we.title,
        nameOfOrganisation: we.nameOfOrganisation,
        natureOfJob: we.natureOfJob,
        jobStartDate: normalizeDate(we.jobStartDate),
        jobEndDate: normalizeDate(we.jobEndDate),
      };
    };

    // Custom logging for work experiences to handle additions, modifications, and deletions separately
    // First log the hasWorkExperience change if it changed
    if (oldData.hasWorkExperience !== newData.hasWorkExperience) {
      await logActivity(user.id, applicationID, "UPDATE_WORK_EXPERIENCE", {
        field: "hasWorkExperience",
        prevValue: oldData.hasWorkExperience,
        newValue: newData.hasWorkExperience,
      });
    }

    // Only process work experience details if hasWorkExperience is true
    if (newData.hasWorkExperience) {
      // Handle work experience changes
      // 1. Find modified work experiences (matching IDs)
      const oldWorkExpMap = new Map(
        oldData.workExperiences.map((we) => [we.id, we])
      );
      const newWorkExpMap = new Map(
        newData.workExperiences
          .filter((we) => we.id && we.id.trim() !== "")
          .map((we) => [we.id, we])
      );

      // Log modified work experiences
      for (const [id, newWorkExp] of newWorkExpMap.entries()) {
        const oldWorkExp = oldWorkExpMap.get(id);
        if (oldWorkExp) {
          // Normalize dates for comparison
          const normalizedOldWorkExp = {
            ...oldWorkExp,
            jobStartDate: normalizeDate(oldWorkExp.jobStartDate),
            jobEndDate: normalizeDate(oldWorkExp.jobEndDate),
          };
          const normalizedNewWorkExp = {
            ...newWorkExp,
            jobStartDate: normalizeDate(newWorkExp.jobStartDate),
            jobEndDate: normalizeDate(newWorkExp.jobEndDate),
          };

          // Compare important fields only to avoid false positives from date formatting
          const hasChanged =
            normalizedOldWorkExp.title !== normalizedNewWorkExp.title ||
            normalizedOldWorkExp.nameOfOrganisation !==
              normalizedNewWorkExp.nameOfOrganisation ||
            normalizedOldWorkExp.natureOfJob !==
              normalizedNewWorkExp.natureOfJob ||
            normalizedOldWorkExp.jobStartDate !==
              normalizedNewWorkExp.jobStartDate ||
            normalizedOldWorkExp.jobEndDate !==
              normalizedNewWorkExp.jobEndDate ||
            normalizedOldWorkExp.url !== normalizedNewWorkExp.url;

          if (hasChanged) {
            await logActivity(
              user.id,
              applicationID,
              "UPDATE_WORK_EXPERIENCE",
              {
                field: `workExperience.${newWorkExp.title}`,
                prevValue: cleanWorkExperienceForLog(oldWorkExp),
                newValue: cleanWorkExperienceForLog(newWorkExp),
              }
            );
          }
        }
      }

      // 2. Find added work experiences (no ID or ID not in old data)
      const addedWorkExps = newData.workExperiences.filter(
        (we) => !we.id || we.id.trim() === "" || !oldWorkExpMap.has(we.id)
      );
      for (const addedWorkExp of addedWorkExps) {
        await logActivity(user.id, applicationID, "ADD_WORK_EXPERIENCE", {
          field: `workExperience.${addedWorkExp.title}`,
          prevValue: null,
          newValue: cleanWorkExperienceForLog(addedWorkExp),
        });
      }

      // 3. Find deleted work experiences (in old but not in new)
      const deletedWorkExps = oldData.workExperiences.filter(
        (we) => !newWorkExpMap.has(we.id)
      );
      for (const deletedWorkExp of deletedWorkExps) {
        await logActivity(user.id, applicationID, "DELETE_WORK_EXPERIENCE", {
          field: `workExperience.${deletedWorkExp.title}`,
          prevValue: cleanWorkExperienceForLog(deletedWorkExp),
          newValue: null,
        });
      }
    } else if (!newData.hasWorkExperience && oldData.hasWorkExperience) {
      // All work experiences were removed because hasWorkExperience is now false
      for (const oldWorkExp of oldData.workExperiences) {
        await logActivity(user.id, applicationID, "DELETE_WORK_EXPERIENCE", {
          field: `workExperience.${oldWorkExp.title}`,
          prevValue: cleanWorkExperienceForLog(oldWorkExp),
          newValue: null,
        });
      }
    }

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

    // Get existing data before updating
    const oldData = {
      specialNeeds: existingApplication.specialNeeds,
      reasonsForChoosingProgram: existingApplication.reasonsForChoosingProgram,
      futureEduPlans: existingApplication.futureEduPlans,
      intentedEmployment: existingApplication.intentedEmployment,
      stateBenefits: existingApplication.stateBenefits,
      criminalRecord: existingApplication.criminalRecord,
      hobbies: existingApplication.hobbies,
      ethnicity: existingApplication.ethnicity,
      religion: existingApplication.religion,
      marketing: existingApplication.marketing,
      terms: existingApplication.terms,
      recruitment_agent: existingApplication.recruitment_agent,
    };

    // Create newData object with the same structure as oldData
    const newData = {
      specialNeeds: values.specialNeeds,
      reasonsForChoosingProgram: values.reasonsForChoosingProgram,
      futureEduPlans: values.futureEduPlans,
      intentedEmployment: values.intentedEmployment,
      stateBenefits: values.stateBenefits,
      criminalRecord: values.criminalRecord,
      hobbies: values.hobbies,
      ethnicity: values.ethnicity,
      religion: values.religion,
      marketing: values.marketing,
      terms: values.terms,
      recruitment_agent: values.recruitment_agent,
    };

    await db.application.update({
      where: {
        id: existingApplication.id,
      },
      data: {
        ...values,
      },
    });

    // Log changes to the audit log
    await logChanges(
      user.id,
      applicationID,
      oldData,
      newData,
      "UPDATE_ADDITIONAL_INFO"
    );

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

    const userDetails = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    };

    // Helper function to get descriptive file type based on form name
    const getFileTypeDescription = (formName) => {
      switch (formName) {
        case "photo":
          return "Profile Photo";
        case "identification":
          return "Identification Document";
        case "immigration":
          return "Immigration Document";
        default:
          return "File";
      }
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

      if (file) {
        // Ensure file exists and has content
        if (!file || file.size === 0) {
          throw new Error("No file or empty file provided");
        }

        // Delete existing file if it exists
        if (existingApplication[urlField]) {
          const fileKey = existingApplication[urlField].split("f/")[1];
          await utapi.deleteFiles(fileKey);

          // Log the file deletion with DELETE_FILE action type
          await logActivity(user.id, applicationID, "DELETE_FILE", {
            field: getFileTypeDescription(formName),
            prevValue:
              existingApplication[nameField] || existingApplication[urlField],
            newValue: null,
          });
        }

        // Upload new file
        const uploadedFile = await utapi.uploadFiles(file);
        personalDetails[urlField] = uploadedFile.data.url;
        if (nameField) personalDetails[nameField] = uploadedFile.data.name;

        // Log the file upload with ADD_FILE action type
        await logActivity(user.id, applicationID, "ADD_FILE", {
          field: getFileTypeDescription(formName),
          prevValue: null,
          newValue:
            personalDetails[nameField] ||
            uploadedFile.data.name ||
            uploadedFile.data.url.split("/").pop(),
        });
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

          // Log the file deletion with DELETE_FILE action type
          await logActivity(user.id, applicationID, "DELETE_FILE", {
            field: getFileTypeDescription(formName),
            prevValue:
              existingApplication[nameField] || existingApplication[urlField],
            newValue: null,
          });
        }
        personalDetails[urlField] = null;
        if (nameField) personalDetails[nameField] = null;
      }
    }

    if (userDetails.firstName?.trim() || userDetails.lastName?.trim()) {
      const currentUser = await db.user.findUnique({
        where: {
          id: existingApplication.userID,
        },
      });

      if (
        currentUser.firstName !== userDetails.firstName ||
        currentUser.lastName !== userDetails.lastName
      ) {
        await db.user.update({
          where: {
            id: existingApplication.userID,
          },
          data: {
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
          },
        });
      }
    }

    // Create oldData object with existing application values
    const oldData = {
      title: existingApplication.title,
      firstName: existingApplication.firstName,
      lastName: existingApplication.lastName,
      gender: existingApplication.gender,
      dateOfBirth: existingApplication.dateOfBirth,
      placeOfBirth: existingApplication.placeOfBirth,
      countryOfBirth: existingApplication.countryOfBirth,
      identificationNo: existingApplication.identificationNo,
      nationality: existingApplication.nationality,
      addressLine1: existingApplication.addressLine1,
      addressLine2: existingApplication.addressLine2,
      city: existingApplication.city,
      postcode: existingApplication.postcode,
      email: existingApplication.email,
      mobileNo: existingApplication.mobileNo,
      homeTelephoneNo: existingApplication.homeTelephoneNo,
      emergency_contact_name: existingApplication.emergency_contact_name,
      emergency_contact_no: existingApplication.emergency_contact_no,
      tuitionFees: existingApplication.tuitionFees,
      isEnglishFirstLanguage: existingApplication.isEnglishFirstLanguage,
      entryDateToUK: existingApplication.entryDateToUK,
      immigration_status: existingApplication.immigration_status,
      share_code: existingApplication.share_code,
      photoUrl: existingApplication.photoUrl,
      photoName: existingApplication.photoName,
      identificationNoUrl: existingApplication.identificationNoUrl,
      immigration_url: existingApplication.immigration_url,
      immigration_name: existingApplication.immigration_name,
    };

    await db.application.update({
      where: { id: existingApplication.id },
      data: personalDetails,
    });

    // Create filtered copies of oldData and personalDetails without file fields
    const fileFields = [
      "photoUrl",
      "photoName",
      "identificationNoUrl",
      "immigration_url",
      "immigration_name",
    ];

    const filteredOldData = { ...oldData };
    const filteredNewData = { ...personalDetails };

    // Remove file-related fields from the objects to prevent double-logging
    fileFields.forEach((field) => {
      delete filteredOldData[field];
      delete filteredNewData[field];
    });

    // Log changes to the audit log
    await logChanges(
      user.id,
      applicationID,
      filteredOldData,
      filteredNewData,
      "UPDATE_PERSONAL_DETAILS"
    );

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

    // Prepare old and new data objects for audit logging
    const oldData = {
      courseID: existingApplication.courseID,
      courseTitle: existingApplication.courseTitle,
      studyMode: existingApplication.studyMode,
      campus: existingApplication.campus,
      commencement: existingApplication.commencement,
      ab_registration_no: existingApplication.ab_registration_no,
      ab_registration_date: existingApplication.ab_registration_date,
    };

    const newData = {
      courseID: existingCourse.id,
      courseTitle: values.courseTitle,
      studyMode: values.studyMode,
      campus: values.campus,
      commencement: values.commencement,
      ab_registration_no: values.ab_registration_no || null,
      ab_registration_date: values.ab_registration_date || null,
    };

    // Check if the course is actually changing
    if (
      existingApplication.courseID === existingCourse.id &&
      existingApplication.studyMode === values.studyMode &&
      existingApplication.campus === values.campus &&
      existingApplication.commencement === values.commencement &&
      existingApplication.ab_registration_no === values.ab_registration_no &&
      existingApplication.ab_registration_date === values.ab_registration_date
    ) {
      return;
    }

    const {
      courseTitle,
      studyMode,
      campus,
      commencement,
      ab_registration_no,
      ab_registration_date,
    } = values;

    await db.application.update({
      where: { id: existingApplication.id },
      data: {
        course: {
          connect: {
            id: existingCourse.id,
          },
        },
        courseTitle,
        studyMode,
        campus,
        commencement,
        ab_registration_no: ab_registration_no || null,
        ab_registration_date: ab_registration_date || null,
      },
    });

    // Log the changes to the audit log
    await logChanges(
      user.id,
      applicationID,
      oldData,
      newData,
      "UPDATE_COURSE_DETAILS"
    );

    return { success: "Course details updated successfully" };
  } catch (error) {
    console.error("[UPDATING_COURSE_DETAILS_ERROR]", error);
    return { error: "Something went wrong" };
  }
};

export const updatePaymentPlan = async (values, applicationID) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorised" };
    }

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

    if (file) {
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

    // Get the existing payment plan data before updating
    const existingPaymentPlan = await db.paymentPlan.findUnique({
      where: { applicationID },
    });

    // Get the existing application data for file information
    const existingApplication = await db.application.findUnique({
      where: { id: applicationID },
      select: {
        tuition_doc_url: true,
        tuition_doc_name: true,
      },
    });

    // Create oldData object with existing values
    const oldData = {
      ...(existingPaymentPlan || {}),
      tuition_doc_url: existingApplication?.tuition_doc_url,
      tuition_doc_name: existingApplication?.tuition_doc_name,
    };

    // Create newData object with updated values
    const newData = {
      ...paymentPlanData,
      ...(fileData || {}),
    };

    // Execute the database transactions
    await db.$transaction(transactions);

    // Log changes to the audit log
    await logChanges(
      user.id,
      applicationID,
      oldData,
      newData,
      "UPDATE_PAYMENT_PLAN"
    );

    return { success: "Student finance details updated successfully" };
  } catch (error) {
    console.error("[UPDATING_PAYMENT_PLAN_ERROR]", error);
    return { error: "Something went wrong" };
  }
};
