"use server";

import { getStaffByID } from "@/data/staff";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

export const staff = async (values, staffID) => {
  try {
    const utapi = new UTApi();
    const user = await currentUser();
    const isStaff = user.role === "Staff" || user.role === "Admin";

    if (!user || !isStaff) {
      return { error: "Unauthorised" };
    }

    const existingStaff = await getStaffByID(staffID);

    if (!existingStaff) {
      return { error: "Staff not found!" };
    }

    const {
      title,
      firstName,
      lastName,
      email,
      phone,
      nationality,
      dateOfBirth,
      address,
      city,
      visa_duration,
      visa_expiry_date,
      visa_expiry_reminder,
      postcode,
      country,
    } = values;

    if (values instanceof FormData) {
      if (values.has("photo")) {
        // Delete existing photo if there is one
        if (existingStaff.photoUrl) {
          const existingFileKey = existingStaff.photoUrl.split("f/")[1];
          await utapi.deleteFiles(existingFileKey);
        }

        // Upload new photo
        const file = values.get("photo");
        const uploadedFile = await utapi.uploadFiles(file);

        await db.staff.update({
          where: { id: staffID },
          data: { photoUrl: uploadedFile.data.url },
        });

        return { success: "Profile photo updated successfully" };
      } else if (values.has("deletePhoto")) {
        // Delete existing photo
        if (existingStaff.photoUrl) {
          const existingFileKey = existingStaff.photoUrl.split("f/")[1];
          await utapi.deleteFiles(existingFileKey);
        }

        await db.staff.update({
          where: { id: staffID },
          data: { photoUrl: null },
        });

        return { success: "Profile photo deleted successfully" };
      }
    }

    const employment = [];

    // Check if the values are a FormData object - if so, we are updating employment
    if (values instanceof FormData) {
      for (let i = 0; values.has(`employment[${i}][job_title]`); i++) {
        const emp = {
          id: values.get(`employment[${i}][id]`),
          job_title: values.get(`employment[${i}][job_title]`),
          department: values.get(`employment[${i}][department]`),
          nameOfOrg: values.get(`employment[${i}][nameOfOrg]`),
          type: values.get(`employment[${i}][type]`),
          start_date: new Date(values.get(`employment[${i}][start_date]`)),
          end_date: new Date(values.get(`employment[${i}][end_date]`)),
        };

        const file = values.get(`employment[${i}][files][0]`);
        const existingFile = values.get(`employment[${i}][existingFile]`);
        const deleteFile = values.get(`employment[${i}][deleteFile]`);

        if (file) {
          emp.newFile = file;
        } else if (existingFile) {
          emp.existingFile = existingFile;
        } else if (deleteFile === "true") {
          emp.deleteFile = true;
        }

        employment.push(emp);
      }
    }

    // If we have employment records to update, do so
    if (employment && employment.length > 0) {
      for (const emp of employment) {
        if (emp.id) {
          // Update existing employment
          const existingEmployment = await db.staffEmployment.findUnique({
            where: { id: emp.id },
          });

          if (!existingEmployment) {
            throw new Error(`Employment record not found: ${emp.id}`);
          }

          let fileUpdate = {};

          if (emp.newFile) {
            // Delete existing file if there is one
            if (existingEmployment.doc_url) {
              const fileKey = existingEmployment.doc_url.split("f/")[1];
              await utapi.deleteFiles(fileKey);
            }
            // Upload new file
            const uploadedFile = await utapi.uploadFiles(emp.newFile);
            fileUpdate = {
              doc_url: uploadedFile.data.url,
              doc_name: uploadedFile.data.name,
            };
          } else if (emp.deleteFile) {
            // Delete existing file
            if (existingEmployment.doc_url) {
              const fileKey = existingEmployment.doc_url.split("f/")[1];
              await utapi.deleteFiles(fileKey);
            }
            fileUpdate = { doc_url: null, doc_name: null };
          }

          await db.staffEmployment.update({
            where: { id: emp.id },
            data: {
              job_title: emp.job_title,
              department: emp.department,
              nameOfOrg: emp.nameOfOrg,
              type: emp.type,
              start_date: emp.start_date,
              end_date: emp.end_date,
              ...fileUpdate,
            },
          });
        } else {
          // Create new employment entry
          let fileData = {};
          if (emp.newFile) {
            const uploadedFile = await utapi.uploadFiles(emp.newFile);
            fileData = {
              doc_url: uploadedFile.data.url,
              doc_name: uploadedFile.data.name,
            };
          }

          await db.staffEmployment.create({
            data: {
              staffID,
              job_title: emp.job_title,
              department: emp.department,
              nameOfOrg: emp.nameOfOrg,
              type: emp.type,
              start_date: emp.start_date,
              end_date: emp.end_date,
              ...fileData,
            },
          });
        }
      }

      return { success: "Successfully updated staff details!" };
    }

    await db.$transaction(async (db) => {
      await db.staff.update({
        where: {
          id: existingStaff.id,
        },
        data: {
          title,
          firstName,
          dateOfBirth,
          lastName,
          email,
          phone,
          nationality,
          address,
          city,
          postcode,
          country,
          visa_duration,
          visa_expiry_date,
          visa_expiry_reminder,
        },
      });

      await db.user.update({
        where: {
          id: existingStaff.id,
        },
        data: {
          title,
          firstName,
          dateOfBirth,
          lastName,
          email,
          addressLine1: address,
          city,
          postcode,
        },
      });
    });

    return { success: "Successfully updated staff details!" };
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" };
  }
};
