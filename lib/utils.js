import { clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateUserID() {
  const min = 1000000;
  const max = 1999999;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;

  return id.toString();
}

export const formatDate = (date) => {
  return dayjs(date).format("DD-MM-YYYY");
};

export const formatDateTime = (dateTime) => {
  return {
    date: dayjs(dateTime).format("DD-MM-YYYY"),
    dateLong: dayjs(dateTime).format("DD MMMM YYYY"),
    time: dayjs(dateTime).format("HH:mm a"),
    dateTime: dayjs(dateTime).format("DD-MM-YYYY [at] HH:mm"),
  };
};

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const getDisplayStatus = (status) => {
  const statusMap = {
    ["Submitted"]: "Submitted",
    ["Approved"]: "Approved",
    ["Rejected"]: "Rejected",
    ["Waiting_For_Change"]: "Waiting for Change",
    ["Re_Submitted"]: "Re-Submitted",
    ["Approved_for_Interview"]: "Approved for Interview",
    ["Interview_successful"]: "Interview Successful",
    ["Unfinished"]: "Unfinished",
    ["Finished"]: "Finished",
    ["Void"]: "Void",
  };

  return statusMap[status];
};

export const getDisplayEthnicity = (ethnicity) => {
  const ethnicityMap = {
    white_british: "White Welsh, Scottish or British",
    white_irish: "Irish",
    gypsy_traveller: "Gypsy or Traveller",
    white_other: "Any other White background",
    mixed_white_black_caribbean: "White and Black Caribbean",
    mixed_white_black_african: "White and Black African",
    mixed_white_asian: "White and Asian",
    black_or_black_british_caribbean: "Black or Black British - Caribbean",
    black_or_black_british_african: "Black or Black British - African",
    asian_or_asian_british_indian: "Asian or Asian British - Indian",
    asian_or_asian_british_pakistani: "Asian or Asian British - Pakistani",
    asian_or_asian_british_bangladeshi: "Asian or Asian British - Bangladeshi",
    asian_chinese: "Chinese",
    asian_other: "Any other Asian background",
    black_african: "African",
    black_caribbean: "Caribbean",
    arab: "Arab",
    prefer_not_to_say: "Prefer not to say",
  };

  return ethnicityMap[ethnicity] || capitalizeFirstLetter(ethnicity);
};

export const getDisplayReligion = (religion) => {
  const religionMap = {
    christianity: "Christianity",
    islam: "Islam",
    hindu: "Hinduism",
    buddhism: "Buddhism",
    sikhism: "Sikhism",
    judaism: "Judaism",
    pagan: "Pagan",
    bahai: "Baháʼí Faith",
    no_religion: "No religion",
    prefer_not_to_say: "Prefer not to say",
  };

  return religionMap[religion] || capitalizeFirstLetter(religion);
};

export const fillPDFTemplate = async (templateUrl, replacements) => {
  // Fetch the PDF file
  const pdfBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get all pages of the document
  const pages = pdfDoc.getPages();
  const form = pdfDoc.getForm();

  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSize = 9.75;

  for (const [placeholder, value] of Object.entries(replacements)) {
    const textField = form.getTextField(placeholder);
    textField.setText(value);

    textField.setFontSize(fontSize);

    if (["studentID", "studentName", "courseTitle"].includes(placeholder)) {
      textField.updateAppearances(timesBoldFont);
    } else {
      textField.updateAppearances(timesFont);
    }
  }

  form.flatten();
  // Save the modified PDF
  const modifiedPdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  return modifiedPdfBytes;
};
