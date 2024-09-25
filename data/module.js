import { db } from "@/lib/db";

export const getModuleByCode = async (code) => {
  try {
    const module = await db.module.findUnique({
      where: {
        code: code,
      },
    });

    return module;
  } catch (error) {
    console.log("[GET_MODULE_BY_CODE]", error);
    return null;
  }
};
