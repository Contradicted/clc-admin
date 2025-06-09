"use server";

import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logActivity } from "./activity-log";
import { revalidatePath } from "next/cache";

/**
 * Upload a document for a student application by admin staff
 */
export const uploadStaffDocument = async (formData) => {
  try {
    const user = await currentUser();
    const utapi = new UTApi();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorized" };
    }

    const applicationId = formData.get("applicationId");
    const file = formData.get("file");

    if (!applicationId || !file) {
      return { error: "Missing required fields" };
    }

    // Check if application exists
    const application = await db.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return { error: "Application not found" };
    }

    // Upload file to uploadThing
    const uploadedFile = await utapi.uploadFiles(file);

    if (!uploadedFile?.data?.url) {
      throw new Error("Upload failed - no URL in response");
    }

    // Create document record in database
    const document = await db.document.create({
      data: {
        fileName: file.name,
        fileUrl: uploadedFile.data.url,
        applicationID: applicationId,
        userID: user.id,
      },
    });

    // Log the file upload with ADD_FILE action type
    await logActivity(user.id, applicationId, "ADD_FILE", {
      field: "Staff Document",
      prevValue: null,
      newValue: uploadedFile.data.name,
    });

    return { success: true, document };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { error: "Failed to upload document" };
  }
};

/**
 * Get all staff documents for an application
 */
export const getStaffDocuments = async (applicationId) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorized" };
    }

    // Check if Document model exists in the schema
    let documents = [];
    try {
      documents = await db.document.findMany({
        where: { applicationID: applicationId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return {
        documents: [],
        error:
          "Document model may not be migrated yet. Please run 'npx prisma migrate dev'.",
      };
    }

    return { documents };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { error: "Failed to fetch documents", documents: [] };
  }
};

/**
 * Delete a staff document
 */
export const deleteStaffDocument = async (documentId) => {
  try {
    const user = await currentUser();
    const utapi = new UTApi();

    if (!user || user.role !== "Admin") {
      return { error: "Unauthorized" };
    }

    // Get the document to delete
    let document;
    try {
      document = await db.document.findUnique({
        where: { id: documentId },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return {
        error:
          "Document model may not be migrated yet. Please run 'npx prisma migrate dev'.",
      };
    }

    if (!document) {
      return { error: "Document not found" };
    }

    // Delete file from uploadThing
    if (document.fileUrl) {
      const fileKey = document.fileUrl.split("f/")[1];
      await utapi.deleteFiles(fileKey);
    }

    // Delete document record from database
    try {
      await db.document.delete({
        where: { id: documentId },
      });

      // Log the file deletion with DELETE_FILE action type
      await logActivity(user.id, document.applicationID, "DELETE_FILE", {
        field: "Staff Document",
        prevValue: document.fileName || document.fileUrl,
        newValue: null,
      });
    } catch (dbError) {
      console.error("Database delete error:", dbError);
      return {
        error:
          "Failed to delete document record. The model may not be migrated yet.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { error: "Failed to delete document" };
  }
};
