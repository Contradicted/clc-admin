"use server";

import { logActivity } from "@/actions/activity-log";

export async function logDownloadActivity(userId, applicationId) {
  try {
    await logActivity(userId, applicationId, "DOWNLOAD_FILES", {
      field: "application_files", // Or a more appropriate field name
      prevValue: null,
      newValue: null,
    });
    return { success: true };
  } catch (error) {
    console.error("Error logging download activity:", error);
    return { error: "Failed to log download activity" };
  }
}
