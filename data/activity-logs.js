import { db } from "@/lib/db";

export const getActivityLogsByApplicationID = async (
  applicationID,
  options = {}
) => {
  try {
    const activityLogs = await db.activityLog.findMany({
      where: {
        applicationID,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      ...(options.limit && { take: options.limit }),
    });

    return activityLogs;
  } catch (error) {
    console.error("[FETCHING_ACTIVITY_LOGS_BY_APPLICATION_ID]", error.message);
    return null;
  }
};
