import { db } from "@/lib/db";

export const getStaffByID = async (id) => {
  try {
    const staff = await db.staff.findFirst({
      where: {
        id,
      },
      include: {
        employment: true,
      },
    });

    return staff;
  } catch (error) {
    console.log("[FETCHING_STAFF_BY_ID_ERROR]", error);
    return null;
  }
};
