import { clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

import { PDFDocument, StandardFonts } from "pdf-lib";
import { differenceInWeeks, subYears } from "date-fns";

let counter = 0;

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateUserID() {
  const min = 1000000;
  const max = 1999999;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;

  return id.toString();
}

export const isAdult = (value) => {
  // Calculate the date 18 years ago
  const eighteenYearsAgo = subYears(new Date(), 18);
  // Convert the value to a Date object if it's not already
  const selectedDate = new Date(value);

  // Compare the selected date with the date 18 years ago
  return selectedDate <= eighteenYearsAgo;
};

export function generateStaffID() {
  // Increment counter
  counter++;

  const convertToString = counter.toString().padStart(1, "0");

  return `CLC24900${convertToString}`;
}

export const formatDate = (date) => {
  return dayjs(date).format("DD-MM-YYYY");
};

export function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export const formatDateTime = (dateTime) => {
  return {
    date: dayjs(dateTime).format("DD-MM-YYYY"),
    dateLong: dayjs(dateTime).format("DD MMMM YYYY"),
    time: dayjs(dateTime).format("HH:mm a"),
    dateTime: dayjs(dateTime).format("DD-MM-YYYY [at] HH:mm"),
    dateShort: dayjs(dateTime).format("DD-MMM-YYYY"),
  };
};

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const convertMonthsToYears = (months) => {
  const year = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${year} ${year > 1 ? "years" : "year"}${
    remainingMonths > 0
      ? ` and ${remainingMonths} ${remainingMonths > 1 ? "months" : "month"}`
      : ""
  }`;
};

export const getDisplayStatus = (status) => {
  const statusMap = {
    ["Submitted"]: "Submitted",
    ["Approved"]: "Approved",
    ["Rejected"]: "Rejected",
    ["Waiting_for_Change"]: "Waiting for Change",
    ["Re_Submitted"]: "Re-Submitted",
    ["Approved_for_Interview"]: "Approved for Interview",
    ["Invited_for_Interview"]: "Invited for Interview",
    ["Sent_conditional_letter"]: "Sent Conditional Letter",
    ["Sent_enrollment_letter"]: "Sent Enrollment Letter",
    ["Invited_for_Interview"]: "Invited for Interview",
    ["Interview_successful"]: "Interview Successful",
    ["Enrolled"]: "Enrolled",
    ["Withdrawn"]: "Withdrawn",
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

export const formatStudyMode = (studyMode) => {
  const studyModeMap = {
    ["full_time"]: "Full Time",
    ["part_time"]: "Part Time",
    ["hybrid_learning"]: "Hybrid Learning",
  };

  return studyModeMap[studyMode] || capitalizeFirstLetter(studyMode);
};

export const formatImmigrationStatus = (immigrationStatus) => {
  const immigrationStatusMap = {
    ["settled"]: "Settled",
    ["pre_settled"]: "Pre-Settled",
  };

  return (
    immigrationStatusMap[immigrationStatus] ||
    capitalizeFirstLetter(immigrationStatus)
  );
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

export const calculateWeeksBetweenDates = (startDate, endDate) => {
  if (!startDate || !endDate) return "2";
  const weeks = differenceInWeeks(new Date(endDate), new Date(startDate));
  return Math.max(1, weeks).toString();
};

export const checkIsActive = (lastJoinDate) => {
  // 1. Check if current date is before end date
  // 2. If current date is after end date, commencement is not running
  // 3. If current date is before end date, commencement is running

  const current = new Date();
  const isActive = dayjs(current).isBefore(lastJoinDate);

  return isActive;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats a string to title case (first letter of each word capitalized)
 * Handles special cases like hyphenated names and apostrophes
 * @param {string} text - The text to format
 * @returns {string} - The formatted text
 */
export function toTitleCase(text) {
  if (!text) return "";

  // Split on word boundaries, hyphens, and apostrophes
  return text
    .toLowerCase()
    .split(/\b|(?=-)|(?=')/)
    .map((word) => {
      // Skip empty strings and single quotes
      if (!word || word === "'") return word;
      // Capitalize first letter if it's a word
      return word.match(/^[a-z]/)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word;
    })
    .join("");
}

/**
 * Formats an address string to title case
 * Handles special cases like "St.", "Rd.", etc.
 * Removes extra whitespace and duplicate commas
 * @param {string} address - The address to format
 * @returns {string} - The formatted address
 */
export function formatAddress(address) {
  if (!address) return "";

  const abbreviations = {
    st: "St.",
    rd: "Rd.",
    ave: "Ave.",
    ln: "Ln.",
    ct: "Ct.",
    dr: "Dr.",
    blvd: "Blvd.",
    apt: "Apt.",
    ste: "Ste.",
    unit: "Unit",
    n: "N",
    s: "S",
    e: "E",
    w: "W",
    ne: "NE",
    nw: "NW",
    se: "SE",
    sw: "SW",
  };

  // Step 1: Clean up the address
  let cleanedAddress = address
    // Remove multiple spaces
    .replace(/\s+/g, " ")
    // Remove spaces before commas
    .replace(/\s+,/g, ",")
    // Remove multiple commas
    .replace(/,+/g, ",")
    // Add space after single comma if missing
    .replace(/,([^\s])/g, ", $1")
    // Remove trailing comma
    .replace(/,\s*$/, "")
    // Remove multiple periods (e.g., "St..")
    .replace(/\.+/g, ".")
    // Trim whitespace
    .trim();

  // Step 2: Handle postcodes - extract them to preserve case
  const postcodeParts = cleanedAddress.match(
    /([A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s*\d[A-Za-z]{2})/i
  );
  let postcode = "";
  if (postcodeParts) {
    postcode = postcodeParts[1].toUpperCase();
    // Use a different case for the placeholder to avoid matching issues
    cleanedAddress = cleanedAddress.replace(postcodeParts[1], "<<POSTCODE>>");
  }

  // Step 3: Format the address
  let formattedAddress = cleanedAddress
    .toLowerCase()
    .split(/\b/)
    .map((word) => {
      const lowerWord = word.toLowerCase().trim();
      // Check if word is an abbreviation
      if (abbreviations[lowerWord]) {
        return abbreviations[lowerWord];
      }
      // Regular title case for other words
      return word.match(/^[a-z]/)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word;
    })
    .join("");

  // Step 4: Replace postcode placeholder with actual postcode
  if (postcode) {
    formattedAddress = formattedAddress.replace(/<<postcode>>/i, postcode);
  }

  // Step 5: Clean up any remaining issues
  formattedAddress = formattedAddress
    // Remove duplicate city/location names
    .replace(/(.+),\s*\1$/i, "$1")
    // Ensure consistent spacing around postcodes
    .replace(/\s*([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\s*/g, " $1 ")
    // Clean up any remaining multiple spaces
    .replace(/\s+/g, " ")
    .trim();

  return formattedAddress;
}

/**
 * Formats a postcode to uppercase and ensures proper spacing
 * @param {string} postcode - The postcode to format
 * @returns {string} - The formatted postcode
 */
export function formatPostcode(postcode) {
  if (!postcode) return "";
  return postcode.trim().toUpperCase();
}

/**
 * Formats a commencement date from "January 2025" to "Jan 25"
 * @param {string} commencementDate - The full commencement date
 * @returns {string} - Formatted commencement date
 */
export function formatCommencementDate(commencementDate) {
  if (!commencementDate) return "Not Set";

  // Parse the date string (expected format: "Month Year")
  const parts = commencementDate.split(" ");
  if (parts.length !== 2) return commencementDate;

  const month = parts[0];
  const year = parts[1];

  // Abbreviate the month (first 3 letters)
  const shortMonth = month.substring(0, 3);

  // Abbreviate the year (last 2 digits)
  const shortYear = year.length === 4 ? year.substring(2) : year;

  return `${shortMonth} ${shortYear}`;
}

/**
 * Calculates age from date of birth
 * @param {Date} dateOfBirth - The date of birth
 * @returns {number} - The calculated age
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
