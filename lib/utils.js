import { clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date) => {
  return dayjs(date).format("DD-MM-YYYY");
};

export const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format("DD-MM-YYYY [at] HH:mm");
};

export const getDisplayStatus = (status) => {
  const statusMap = {
    ["Submitted"]: "Submitted",
    ["Approved"]: "Approved",
    ["Rejected"]: "Rejected",
    ["Waiting_For_Change"]: "Waiting for Change",
    ["Re_Submitted"]: "Re-Submitted",
  };

  return statusMap[status];
};