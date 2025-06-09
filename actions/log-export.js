"use server";

import { logActivity } from "@/actions/activity-log";

export async function logExportActivity(userId, applicationId) {
  try {
    await logActivity(userId, applicationId, "EXPORT_APPLICATION", {
      field: "application",
      prevValue: null,
      newValue: null,
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging export activity:", error);
    return { error: "Failed to log export activity" };
  }
}
