import {
  formatStudyMode,
  formatAddress,
  formatPostcode,
  formatDateTime,
} from "./utils";

import { PDFDocument, StandardFonts } from "pdf-lib";

// PDF.js will be loaded dynamically to avoid SSR issues
let pdfjsLib = null;

// Configuration
const CONFIG = {
  maxPreviewWidth: 600,
  defaultFontSize: 10,
  defaultFontName: "Times-Roman",
};

// Template documents
const TEMPLATE_DOCUMENTS = {
  "non-attendance-a": {
    name: "Non-Attendance - Letter A",
    pdfUrl:
      "https://80aygqa1k1.ufs.sh/f/s1GlZLuSvJgyV69VviVS9FmqtfphQ4lGw35bEKxy87nMDHTu",
    subject: "Attendance Notice - First Warning",
  },
  "non-attendance-b": {
    name: "Non-Attendance - Letter B",
    pdfUrl:
      "https://80aygqa1k1.ufs.sh/f/s1GlZLuSvJgyXibvAuIpBsZCFfQPrdpS0g2KyWxjoa8uMzhe",
    subject: "Attendance Notice - Second Warning",
  },
  "non-attendance-c": {
    name: "Non-Attendance - Letter C",
    pdfUrl:
      "https://80aygqa1k1.ufs.sh/f/s1GlZLuSvJgyVy7zHYS9FmqtfphQ4lGw35bEKxy87nMDHTud",
    subject: "Attendance Notice - Final Warning",
  },
  student_status: {
    name: "Student Status",
    pdfUrl:
      "https://80aygqa1k1.ufs.sh/f/s1GlZLuSvJgyc8tF6phuqerPWFsijgBvf3ybL7nmGXZYzk80",
    subject: "Student Status",
  },
  council_tax: {
    name: "Council Tax",
    pdfUrl:
      "https://80aygqa1k1.ufs.sh/f/s1GlZLuSvJgyAYhIx4gWb3tgl7jaRWIivCPms9QDZwe61YBk",
    subject: "Council Tax",
  },
};

// Simple cache
const pdfCache = new Map();

// Field mapping utilities
const FIELD_MAPPINGS = {
  // Personal Information
  studentTitleName: {
    patterns: ["student_title_name", "studenttitlename"],
    getValue: (data) =>
      `${data.title || ""} ${data.firstName || ""} ${data.lastName || ""}`.trim(),
  },
  firstName: {
    patterns: ["firstname", "first_name"],
    getValue: (data) => data.firstName,
  },
  lastName: {
    patterns: ["lastname", "last_name"],
    getValue: (data) => data.lastName,
  },
  fullName: {
    patterns: ["fullname", "full_name"],
    customMatch: (name) =>
      name.includes("name") &&
      !name.includes("title") &&
      !name.includes("university") &&
      !name.includes("college") &&
      !name.includes("course") &&
      !name.includes("campus"),
    getValue: (data) => `${data.firstName || ""} ${data.lastName || ""}`.trim(),
  },
  title: {
    customMatch: (name) =>
      name.includes("title") &&
      !name.includes("name") &&
      !name.includes("course") &&
      !name.includes("university") &&
      !name.includes("college") &&
      !name.includes("campus"),
    getValue: (data) => data.title,
  },
  email: {
    patterns: ["email"],
    getValue: (data) => data.email,
  },
  phone: {
    patterns: ["phone", "mobile"],
    getValue: (data) => data.mobileNo,
  },
  nationality: {
    patterns: ["nationality"],
    getValue: (data) => data.nationality,
  },

  // Address Information
  addressLine1: {
    customMatch: (name) =>
      name.includes("address") &&
      (name.includes("line1") ||
        name.includes("address1") ||
        name.includes("_1") ||
        name === "address"),
    getValue: (data, { template }) => {
      // For council tax and student status templates, combine address lines if both exist
      if (
        template &&
        (template.id === "council_tax" || template.id === "student_status")
      ) {
        const line1 = formatAddress(data.addressLine1);
        const line2 = formatAddress(data.addressLine2);
        return line2 ? `${line1}, ${line2}` : line1;
      }
      // Default behavior for other templates
      return formatAddress(data.addressLine1);
    },
  },
  addressLine2: {
    customMatch: (name) =>
      name.includes("address") &&
      (name.includes("line2") ||
        name.includes("address2") ||
        name.includes("_2")),
    getValue: (data, { template }) => {
      // For council tax and student status templates, always use city + postcode
      if (
        template &&
        (template.id === "council_tax" || template.id === "student_status")
      ) {
        const city = formatAddress(data.city);
        const postcode = formatPostcode(data.postcode);
        return city && postcode
          ? `${city}, ${postcode}`
          : city || postcode || null;
      }
      // Default behavior for other templates
      return formatAddress(data.addressLine2);
    },
  },
  city: {
    patterns: ["city"],
    getValue: (data, { template }) => {
      // No separate city field in council tax and student status templates
      return template &&
        (template.id === "council_tax" || template.id === "student_status")
        ? null
        : formatAddress(data.city);
    },
  },
  postcode: {
    patterns: ["postcode", "postal"],
    getValue: (data, { template }) => {
      // No separate postcode field in council tax and student status templates
      return template &&
        (template.id === "council_tax" || template.id === "student_status")
        ? null
        : formatPostcode(data.postcode);
    },
  },
  country: {
    patterns: ["country"],
    getValue: (data) => formatAddress(data.countryOfBirth),
  },

  // Application Information
  studentId: {
    patterns: ["studentid", "student_id"],
    getValue: (data) => data.enrolledStudent?.id ?? data.userID,
  },
  applicationId: {
    customMatch: (name) => name.includes("application") && name.includes("id"),
    getValue: (data) => data.id,
  },
  courseTitle: {
    patterns: ["coursetitle", "course_title"],
    customMatch: (name) =>
      name.includes("course") &&
      (name.includes("title") || name.includes("name")) &&
      !name.includes("student"),
    getValue: (data) => data.courseTitle,
  },
  universityName: {
    patterns: ["university", "college"],
    customMatch: (name) =>
      (name.includes("university") || name.includes("college")) &&
      (name.includes("name") || name.includes("title")) &&
      !name.includes("student"),
    getValue: () => "City of London College",
  },
  campus: {
    patterns: ["campus"],
    getValue: (data) => data.campus,
  },
  campusName: {
    customMatch: (name) =>
      name.includes("campus") &&
      (name.includes("name") || name.includes("title")) &&
      !name.includes("student"),
    getValue: (data) => data.campus,
  },
  commencement: {
    patterns: ["commencement"],
    getValue: (data) => data.commencement,
  },
  studyMode: {
    patterns: ["studymode", "study_mode"],
    getValue: (data) => formatStudyMode(data.studyMode),
  },
  awardingBody: {
    patterns: ["awarding_body", "awardingbody"],
    getValue: (data, { course }) => course?.awarding_body,
  },
  level: {
    patterns: ["level"],
    getValue: (data) => data.level,
  },
  tuitionFee: {
    customMatch: (name) => name.includes("tuition") && name.includes("fee"),
    getValue: (data) => data.tuitionFee,
  },

  // Duration (special case)
  duration: {
    patterns: ["duration"],
    getValue: (data, { studyModeData }) => {
      if (studyModeData.length > 0) {
        const duration = studyModeData[0].duration;
        return `${duration} Month${duration > 1 ? "s" : ""}`;
      }
      return data.duration;
    },
  },

  // Date fields
  startDate: {
    customMatch: (name) => name.includes("date") && name.includes("start"),
    getValue: (data, { courseDates }) =>
      courseDates.length > 0
        ? formatDateTime(courseDates[0].start_date).date
        : null,
  },
  endDate: {
    customMatch: (name) => name.includes("date") && name.includes("end"),
    getValue: (data, { courseDates }) =>
      courseDates.length > 0
        ? formatDateTime(courseDates[0].end_date).date
        : null,
  },
  issueDate: {
    customMatch: (name) =>
      name.includes("date") &&
      (name.includes("issue") || name.includes("today")),
    getValue: () => new Date().toLocaleDateString(),
  },
  genericDate: {
    patterns: ["date"],
    getValue: () => new Date().toLocaleDateString(),
  },
};

function matchesField(fieldName, mapping) {
  const lowerName = fieldName.toLowerCase();

  if (mapping.customMatch) {
    return mapping.customMatch(lowerName);
  }

  if (mapping.patterns) {
    return mapping.patterns.some((pattern) =>
      lowerName.includes(pattern.toLowerCase())
    );
  }

  return false;
}

function getFieldValue(
  fieldName,
  applicationData,
  courseData,
  template = null
) {
  // Try to match against defined mappings
  for (const [key, mapping] of Object.entries(FIELD_MAPPINGS)) {
    if (matchesField(fieldName, mapping)) {
      const value = mapping.getValue(applicationData, {
        ...courseData,
        template,
      });
      if (value !== null && value !== undefined) {
        // Debug logging in development
        if (process.env.NODE_ENV === "development") {
          console.log(`  ✓ Matched mapping "${key}" for field "${fieldName}"`);
        }
        return value;
      }
    }
  }

  // Fallback to AUTO_FILL_DATA
  const fallbackValue = getAutoFillValue(fieldName);
  if (process.env.NODE_ENV === "development" && fallbackValue) {
    console.log(
      `  → Fallback value for field "${fieldName}": "${fallbackValue}"`
    );
  }
  return fallbackValue;
}

function extractCourseData(applicationData) {
  const course = applicationData?.course;
  let courseDates = [];
  let studyModeData = [];

  if (course?.course_instances && applicationData?.commencement) {
    courseDates = course.course_instances.filter(
      (instance) => instance.instance_name === applicationData.commencement
    );
  }

  if (course?.course_study_mode && applicationData?.studyMode) {
    studyModeData = course.course_study_mode.filter(
      (mode) => mode.study_mode === applicationData.studyMode
    );
  }

  return { course, courseDates, studyModeData };
}

function getFieldWidgets(field) {
  return (
    field.getWidgets?.() ||
    field.widgets ||
    field.acroField?.getWidgets?.() ||
    []
  );
}

function handleAddressLinePositioning(
  fields,
  applicationData,
  template = null
) {
  // For council tax and student status templates, don't reposition if we're using city+postcode in addressLine2
  if (
    template &&
    (template.id === "council_tax" || template.id === "student_status")
  ) {
    // Don't hide addressLine2 field for these templates since we fill it with city+postcode
    return;
  }

  if (applicationData?.addressLine2?.trim()) return; // Has data, no repositioning needed

  const addressLine2Fields = fields.filter((field) => {
    const name = field.getName().toLowerCase();
    return (
      name.includes("address") &&
      (name.includes("line2") ||
        name.includes("address2") ||
        name.includes("2"))
    );
  });

  addressLine2Fields.forEach((addressLine2Field) => {
    try {
      const widgets = getFieldWidgets(addressLine2Field);
      const widget = widgets[0];
      if (!widget?.getRectangle) return;

      const rect = widget.getRectangle();

      // Find and move city/postcode fields
      const fieldsToMove = fields.filter((field) => {
        if (field === addressLine2Field) return false;

        const name = field.getName().toLowerCase();
        if (
          !name.includes("city") &&
          !name.includes("postcode") &&
          !name.includes("postal")
        )
          return false;

        const fieldWidgets = getFieldWidgets(field);
        const fieldWidget = fieldWidgets[0];
        if (!fieldWidget?.getRectangle) return false;

        return fieldWidget.getRectangle().y < rect.y; // Below in PDF space
      });

      // Hide addressLine2 field
      widget.setRectangle?.({ x: rect.x, y: rect.y, width: 0, height: 0 });

      // Move fields up
      const moveUpAmount = rect.height + 5;
      fieldsToMove.forEach((field) => {
        const fieldWidgets = getFieldWidgets(field);
        const fieldWidget = fieldWidgets[0];
        if (!fieldWidget?.setRectangle) return;

        const fieldRect = fieldWidget.getRectangle();
        fieldWidget.setRectangle({
          x: fieldRect.x,
          y: fieldRect.y + moveUpAmount,
          width: fieldRect.width,
          height: fieldRect.height,
        });
      });
    } catch (error) {
      console.warn("Error adjusting addressLine2 positioning:", error);
    }
  });
}

// Utility functions
function getAutoFillValue(fieldName) {
  const lowerName = fieldName.toLowerCase();

  // Basic fallbacks for very specific field patterns only
  if (lowerName.includes("date") && !lowerName.includes("birth")) {
    return new Date().toLocaleDateString();
  }

  // Don't auto-fill name or title fields - these should be explicitly mapped
  // This prevents accidental filling of university names, course titles, etc.

  return null; // Return null for unmapped fields
}

function cleanupScrollbarHiding() {
  document
    .querySelectorAll(".hide-scrollbar")
    .forEach((el) => el.classList.remove("hide-scrollbar"));
}

// Main preview function
export async function getDocumentTemplateReview(
  template,
  applicationData = null,
  zoomLevel = 1
) {
  try {
    const templateDoc = TEMPLATE_DOCUMENTS[template.id];
    if (!templateDoc) {
      return { success: false, error: "Template document not found" };
    }

    // Create application-specific cache key
    const applicationId = applicationData?.id || "no-app";
    const cacheKey = `${template.id}-${applicationId}-${zoomLevel}`;

    if (pdfCache.has(cacheKey)) {
      const cachedPdfBytes = pdfCache.get(cacheKey);
      const previewCanvas = await renderPdfPreview(cachedPdfBytes, zoomLevel);
      return {
        success: true,
        template: templateDoc,
        preview: previewCanvas,
        pdfBytes: cachedPdfBytes,
      };
    }

    const pdfBytes = await fetchPdfTemplate(templateDoc.pdfUrl);
    const filledPdfBytes = await fillPdfTemplate(
      pdfBytes,
      applicationData,
      template
    );
    const previewCanvas = await renderPdfPreview(filledPdfBytes, zoomLevel);

    // Cache the filled PDF with application-specific key
    pdfCache.set(cacheKey, filledPdfBytes);

    return {
      success: true,
      template: templateDoc,
      preview: previewCanvas,
      pdfBytes: filledPdfBytes,
    };
  } catch (error) {
    console.error("PDF preview error:", error);
    return { success: false, error: error.message };
  }
}

// Fetch PDF from URL
async function fetchPdfTemplate(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Fill PDF with data
async function fillPdfTemplate(
  originalPdfBytes,
  applicationData,
  template = null
) {
  if (typeof window === "undefined") {
    return originalPdfBytes;
  }

  try {
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) return originalPdfBytes;

    // Embed fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Extract course data once
    const courseData = extractCourseData(applicationData);

    // Fill each field
    fields.forEach((field) => {
      const fieldName = field.getName();
      const fillValue = getFieldValue(
        fieldName,
        applicationData,
        courseData,
        template
      );

      // Debug logging to help identify field mapping issues
      if (process.env.NODE_ENV === "development") {
        console.log(`PDF Field: "${fieldName}" -> Value: "${fillValue}"`);
      }

      if (
        fillValue !== null &&
        fillValue !== undefined &&
        fillValue !== "" &&
        field.setText
      ) {
        try {
          field.setText(String(fillValue));
          if (field.setFontSize) {
            field.setFontSize(CONFIG.defaultFontSize);
          }
        } catch (error) {
          console.warn(`Failed to fill field "${fieldName}":`, error);
        }
      } else if (fillValue && field.check) {
        fillValue ? field.check() : field.uncheck();
      }
    });

    // Handle address positioning
    handleAddressLinePositioning(fields, applicationData, template);

    // Update field appearances
    try {
      form.updateFieldAppearances(timesRomanFont);
    } catch (error) {
      console.warn("Failed to update field appearances:", error);
    }

    const filledBytes = await pdfDoc.save();

    // Try to flatten form
    try {
      const flattenedDoc = await PDFDocument.load(filledBytes);
      const flattenedForm = flattenedDoc.getForm();

      try {
        await flattenedDoc.embedFont(StandardFonts.TimesRoman);
      } catch (fontError) {
        console.warn("Could not re-embed font in flattened doc:", fontError);
      }

      flattenedForm.flatten();
      return await flattenedDoc.save();
    } catch (flattenError) {
      console.warn(
        "Form flattening failed, returning filled form:",
        flattenError
      );
      return filledBytes;
    }
  } catch (error) {
    console.error("PDF filling error:", error);
    return originalPdfBytes;
  }
}

// Render PDF as canvas
async function renderPdfPreview(pdfBytes, zoomLevel = 1) {
  if (typeof window === "undefined") {
    return null; // Don't show any preview on server-side
  }

  try {
    // Dynamically load PDF.js if not already loaded (client-side only)
    if (!pdfjsLib) {
      pdfjsLib = await import("pdfjs-dist");

      // Set up worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) })
      .promise;
    const page = await pdf.getPage(1);

    // Calculate scale
    const naturalViewport = page.getViewport({ scale: 1.0 });
    const baseScale = CONFIG.maxPreviewWidth / naturalViewport.width;
    const scale = baseScale * zoomLevel;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Style canvas
    canvas.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: white;
      display: block;
      height: auto;
      margin: 0 auto;
      ${zoomLevel <= 1 ? "max-width: 100%;" : ""}
    `;

    // Render PDF
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;

    // Add pan functionality if zoomed in
    if (zoomLevel > 1) {
      addPanFunctionality(canvas);
    }

    return canvas;
  } catch (error) {
    console.error("PDF rendering error:", error);
    return null; // Don't show preview on error
  }
}

// Add pan functionality
function addPanFunctionality(canvas) {
  // Find scrollable container
  let scrollContainer = canvas.closest(".overflow-auto");
  if (!scrollContainer) {
    let parent = canvas.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (
        parent.classList.contains("overflow-auto") ||
        style.overflow === "auto" ||
        style.overflowY === "auto"
      ) {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }

  if (!scrollContainer) {
    setTimeout(() => addPanFunctionality(canvas), 100);
    return;
  }

  // Hide scrollbars
  if (!document.getElementById("hide-scrollbar-style")) {
    const style = document.createElement("style");
    style.id = "hide-scrollbar-style";
    style.textContent = `
      .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }
  scrollContainer.classList.add("hide-scrollbar");

  // Set up panning
  let isPanning = false;
  let startX = 0,
    startY = 0,
    scrollLeft = 0,
    scrollTop = 0;

  canvas.style.cursor = "grab";
  canvas.style.userSelect = "none";

  canvas.addEventListener("mousedown", (e) => {
    isPanning = true;
    canvas.style.cursor = "grabbing";
    startX = e.clientX;
    startY = e.clientY;
    scrollLeft = scrollContainer.scrollLeft;
    scrollTop = scrollContainer.scrollTop;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    e.preventDefault();
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    scrollContainer.scrollLeft = scrollLeft - deltaX;
    scrollContainer.scrollTop = scrollTop - deltaY;
  });

  document.addEventListener("mouseup", () => {
    isPanning = false;
    canvas.style.cursor = "grab";
  });

  canvas.addEventListener("mouseleave", () => {
    isPanning = false;
    canvas.style.cursor = "grab";
  });

  // Touch support
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    scrollLeft = scrollContainer.scrollLeft;
    scrollTop = scrollContainer.scrollTop;
    e.preventDefault();
  });

  canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    scrollContainer.scrollLeft = scrollLeft - deltaX;
    scrollContainer.scrollTop = scrollTop - deltaY;
    e.preventDefault();
  });
}

// Create placeholder canvas
function createPlaceholderCanvas(message = "Preview not available") {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  canvas.style.cssText = `
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    background: #f9fafb;
    max-width: 100%;
  `;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6b7280";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);

  return canvas;
}

// Helper functions
export function getTemplateInfo(templateId) {
  return TEMPLATE_DOCUMENTS[templateId] || null;
}

export function hasTemplate(templateId) {
  return templateId in TEMPLATE_DOCUMENTS;
}
