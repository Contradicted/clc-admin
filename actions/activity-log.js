import { getUserById } from "@/data/student";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

/**
 * Log an activity in the audit log
 * @param {string} userID - The ID of the user performing the action
 * @param {string} applicationID - ID of the application
 * @param {string} action - The type of action (e.g., UPDATE_PERSONAL_DETAILS)
 * @param {Object} details - Additional details
 * @param {string} [details.field] - The field that was changed
 * @param {any} [details.prevValue] - The previous value
 * @param {any} [details.newValue] - The new value
 * @returns {Promise<Object>} Result object
 */
export const logActivity = async (
  userID,
  applicationID,
  action,
  details = {}
) => {
  const user = await getUserById(userID);

  if (!user || user?.role !== "Admin") {
    return { error: "Unauthorised" };
  }

  // Extract details with defaults
  const { field = null, prevValue = null, newValue = null } = details;

  // Helper function to process values before stringifying
  const processValue = (value) => {
    if (value === null || value === undefined) return null;
    
    // If it's a string, return as is
    if (typeof value === 'string') return value;
    
    // If it's a Date object, format it with date and time
    if (value instanceof Date) {
      return formatDateTime(value).dateTime;
    }
    
    // If it's an object with a date property that's a Date object, format that property
    if (typeof value === 'object' && value !== null) {
      const processed = { ...value };
      
      // Process any Date objects in the object
      for (const key in processed) {
        if (processed[key] instanceof Date) {
          processed[key] = formatDateTime(processed[key]).dateTime;
        }
      }
      
      return JSON.stringify(processed);
    }
    
    // Otherwise stringify as before
    return JSON.stringify(value);
  };
  
  // Process values
  const prevValueStr = processValue(prevValue);
  const newValueStr = processValue(newValue);

  // Create the activity log entry
  await db.activityLog.create({
    data: {
      userID,
      applicationID,
      action,
      details: JSON.stringify({
        field,
        prevValue: prevValueStr,
        newValue: newValueStr,
      }),
    },
  });

  return { success: "Activity logged successfully!" };
};

/**
 * Helper function to log field changes
 * @param {string} userID - The ID of the user performing the action
 * @param {string} applicationID - ID of the application being modified
 * @param {Object} oldData - The original data object
 * @param {Object} newData - The updated data object
 * @returns {Promise<Object>} Result object
 */
export const logChanges = async (
  userID,
  applicationID,
  oldData,
  newData,
  action
) => {
  // Find all changed fields
  const changes = [];

  // Compare all fields in newData with oldData
  for (const [key, value] of Object.entries(newData)) {
    // Skip if the field doesn't exist in oldData or hasn't changed
    if (
      !(key in oldData) ||
      JSON.stringify(oldData[key]) === JSON.stringify(value)
    ) {
      continue;
    }

    changes.push({
      field: key,
      prevValue: oldData[key],
      newValue: value,
    });
  }

  // Log each changed field
  for (const change of changes) {
    await logActivity(userID, applicationID, action, {
      field: change.field,
      prevValue: change.prevValue,
      newValue: change.newValue,
    });
  }

  return { success: `Logged ${changes.length} changes successfully!` };
};
