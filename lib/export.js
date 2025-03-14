import { applicationHeaders, RECRUITMENT_AGENTS } from "@/constants";
import {
  formatDateTime,
  formatImmigrationStatus,
  formatStudyMode,
  getDisplayEthnicity,
  getDisplayReligion,
  getDisplayStatus,
  toTitleCase,
  formatAddress,
  formatPostcode,
} from "./utils";
import { db } from "./db";
import dayjs from "dayjs";
import { format } from "date-fns";
const ExcelJS = require("exceljs");

function collectFileUrls(data) {
  let urls = [];

  if (data.photoUrl) urls.push(data.photoUrl);
  if (data.identificationNoUrl) urls.push(data.identificationNoUrl);

  data.qualifications?.forEach((qual) => {
    if (qual.url) urls.push(qual.url);
  });

  data.workExperience?.forEach((we) => {
    if (we.url) urls.push(we.url);
  });

  if (data.immigration_url) urls.push(data.immigration_url);
  if (data.signatureUrl) urls.push(data.signatureUrl);

  return urls;
}

function formatCsvValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatCsvRow(row) {
  return row.map(formatCsvValue).join(',');
}

// Helper function to format CSV content with UTF-8 BOM
function formatCsvContent(headers, rows) {
  // Add UTF-8 BOM at the start
  const BOM = '\uFEFF';
  
  // Format headers
  const headerRow = headers.map(header => `"${header}"`).join(',');
  
  // Format data rows
  const dataRows = rows
    .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return BOM + headerRow + '\n' + dataRows;
}

// Helper function to format dates consistently
function formatDateDDMMMYYYY(date, isOnDemand = false) {
  if (isOnDemand) return "On Demand";
  if (!date) return "";
  try {
    return format(new Date(date), "dd-MMM-yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

// Helper function to format course dates
function formatCourseDates(course) {
  const hasOnDemandInstance = course.course_instances?.some(
    instance => instance.instance_name === "On Demand"
  );

  if (hasOnDemandInstance) {
    return {
      startDate: "On Demand",
      endDate: "Flexible",
      lastJoinDate: "Any time",
      resultsDate: "Upon completion"
    };
  }

  return {
    startDate: formatDateDDMMMYYYY(course.startDate),
    endDate: formatDateDDMMMYYYY(course.endDate),
    lastJoinDate: formatDateDDMMMYYYY(course.last_join_date),
    resultsDate: formatDateDDMMMYYYY(course.results_date)
  };
}

// Helper function to format currency with pound sign
function formatCurrency(amount) {
  if (!amount) return "";
  return `£${amount.toLocaleString('en-GB', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

// Helper function to format full name
function formatFullName(title, firstName, lastName) {
  return [title, firstName, lastName]
    .filter(Boolean)  // Remove empty/null/undefined values
    .map(part => toTitleCase(part.trim()))  // Trim each part and convert to title case
    .filter(part => part.length > 0)  // Remove parts that are just whitespace
    .join(" ")  // Join with single space
    .trim();  // Final trim to remove any extra whitespace
}

export function exportApplicationToCSV(data) {
  const filename = `application-${data.id}`;
  let excludeColumns = [];

  let headers = [
    ...applicationHeaders
      .filter(
        (header) => !["Bristol Campus", "London Campus", "Sheffield Campus", "Birmingham Campus"].includes(header.label)
      )
      .map((header) => header.label),
  ];

  // Find the index of "Commencement" and insert "Campus" after it
  const commencementIndex = headers.indexOf("Commencement");
  if (commencementIndex !== -1) {
    headers.splice(commencementIndex + 1, 0, "Campus");
  }

  // Add Files column only once at the end if not already present
  if (!headers.includes("Files")) {
    headers.push("Files");
  }

  const campus = data.campus;

  if (data.qualifications.length > 1) {
    data.qualifications.map((qual, index) => {
      index > 0 &&
        headers.splice(
          headers.indexOf("Date Awarded") + 1,
          0,
          ...[
            `Qualification Title (${index + 1})`,
            `Examining Body (${index + 1})`,
            `Date Awarded (${index + 1})`,
            `Learner Reference (${index + 1})`,
            `Certificate Reference (${index + 1})`,
          ]
        );
    });
  }

  if (data.hasPendingResults) {
    if (data.pendingQualifications.length > 1) {
      data.pendingQualifications.map((qual, index) => {
        index > 0 &&
          headers.splice(
            headers.indexOf("(Pending) Subjects Passed") + 1,
            0,
            `(Pending) Qualification Title (${index + 1})`,
            `(Pending) Examining Body (${index + 1})`,
            `(Pending) Date of Results (${index + 1})`,
            `(Pending) Subjects Passed (${index + 1})`
          );
      });
    }
  } else {
    excludeColumns = [
      "(Pending) Qualification Title",
      "(Pending) Examining Body",
      "(Pending) Date of Results",
      "(Pending) Subjects Passed",
      "(Pending) Learner Reference",
      "(Pending) Certificate Reference",
    ];
  }

  if (data.hasWorkExperience) {
    if (data.workExperience.length > 1) {
      data.workExperience.map((we, index) => {
        index > 0 &&
          headers.splice(
            headers.indexOf("Job End Date") + 1,
            0,
            `Job Title (${index + 1})`,
            `Name of Organisation (${index + 1})`,
            `Nature of Job (${index + 1})`,
            `Job Start Date (${index + 1})`,
            `Job End Date (${index + 1})`
          );
      });
    }
  } else {
    excludeColumns.push(
      "Job Title",
      "Name of Organisation",
      "Nature of Job",
      "Job Start Date",
      "Job End Date"
    );
  }

  // Exclude columns if they don't exist (optional fields)
  !data.entryDateToUK && excludeColumns.push("Entry Date to UK");
  !data.immigration_status && excludeColumns.push("Immigration Status");
  !data.share_code && excludeColumns.push("Share Code");
  !data.recruitment_agent &&
    excludeColumns.push("Name of Recruitment Agent");

  headers = headers.filter((header) => !excludeColumns.includes(header));

  const fileUrls = collectFileUrls(data);

  const csvContent = [
    headers.join(","),
    headers
      .map((header) => {
        let cellValue;

        if (header === "Files") {
          cellValue = fileUrls.join("\n");
        } else if (header === "Campus") {
          cellValue = campus;
        } else if (
          header === "Qualification Title" ||
          header === "Examining Body" ||
          header === "Date Awarded" ||
          header === "Learner Reference" ||
          header === "Certificate Reference"
        ) {
          cellValue =
            header === "Date Awarded"
              ? formatDateDDMMMYYYY(
                  data.qualifications[0][
                    applicationHeaders.find((h) => h.label === header).value
                  ]
                )
              : data.qualifications[0][
                  applicationHeaders.find((h) => h.label === header).value
                ];
        } else if (
          header.startsWith("Qualification Title (") ||
          header.startsWith("Examining Body (") ||
          header.startsWith("Date Awarded (") ||
          header.startsWith("Learner Reference (") ||
          header.startsWith("Certificate Reference (")
        ) {
          const index = parseInt(header.match(/\((\d+)\)/)[1]);
          const key = header.split(" (")[0].replace(/ /g, " ");
          cellValue = header.startsWith("Date Awarded (")
            ? formatDateDDMMMYYYY(
                data.qualifications[index - 1][
                  applicationHeaders.find((h) => h.label === key).value
                ]
              )
            : data.qualifications[index - 1][
                applicationHeaders.find((h) => h.label === key).value
              ];
        } else if (
          header === "(Pending) Qualification Title" ||
          header === "(Pending) Examining Body" ||
          header === "(Pending) Date of Results" ||
          header === "(Pending) Subjects Passed"
        ) {
          cellValue =
            header === "(Pending) Date of Results"
              ? formatDateDDMMMYYYY(
                  data.pendingQualifications[0][
                    applicationHeaders.find((h) => h.label === header).value
                  ]
                )
              : data.pendingQualifications[0][
                  applicationHeaders.find((h) => h.label === header).value
                ];
        } else if (
          header.startsWith("(Pending) Qualification Title (") ||
          header.startsWith("(Pending) Examining Body (") ||
          header.startsWith("(Pending) Date of Results (") ||
          header.startsWith("(Pending) Subjects Passed (")
        ) {
          const index = parseInt(header.match(/\((\d+)\)/)[1]);
          const key = header.split(" (")[0].replace(/ /g, " ");
          cellValue = header.startsWith("(Pending) Date of Results (")
            ? formatDateDDMMMYYYY(
                data.pendingQualifications[index - 1][
                  applicationHeaders.find((h) => h.label === key).value
                ]
              )
            : data.pendingQualifications[index - 1][
                applicationHeaders.find((h) => h.label === key).value
              ];
        } else if (
          header === "Job Title" ||
          header === "Name of Organisation" ||
          header === "Nature of Job" ||
          header === "Job Start Date" ||
          header === "Job End Date"
        ) {
          cellValue =
            header === "Job Start Date" || header === "Job End Date"
              ? formatDateDDMMMYYYY(
                  data.workExperience[0][
                    applicationHeaders.find((h) => h.label === header).value
                  ]
                )
              : data.workExperience[0][
                  applicationHeaders.find((h) => h.label === header).value
                ];
        } else if (
          header.startsWith("Job Title (") ||
          header.startsWith("Name of Organisation (") ||
          header.startsWith("Nature of Job (") ||
          header.startsWith("Job Start Date (") ||
          header.startsWith("Job End Date (")
        ) {
          const index = parseInt(header.match(/\((\d+)\)/)[1]);
          const key = header.split(" (")[0].replace(/ /g, " ");
          cellValue =
            header.startsWith("Job Start Date (") ||
            header.startsWith("Job End Date (")
              ? formatDateDDMMMYYYY(
                  data.workExperience[index - 1][
                    applicationHeaders.find((h) => h.label === key).value
                  ]
                )
              : data.workExperience[index - 1][
                  applicationHeaders.find((h) => h.label === key).value
                ];
        } else {
          const field = applicationHeaders.find(
            (h) => h.label === header
          ).value;
          cellValue = data[field];

          switch (field) {
            case "dateOfBirth":
              cellValue = formatDateDDMMMYYYY(cellValue);
              break;
            case "religion":
              cellValue = getDisplayReligion(cellValue);
              break;
            case "studyMode":
              cellValue = formatStudyMode(cellValue);
              break;
            case "ethnicity":
              cellValue = getDisplayEthnicity(cellValue);
              break;
            case "entryDateToUK":
              cellValue = formatDateDDMMMYYYY(cellValue);
              break;
            case "immigration_status":
              cellValue = formatImmigrationStatus(cellValue);
              break;
            case "createdAt":
              cellValue = formatDateDDMMMYYYY(cellValue);
              break;
          }
        }

        return cellValue !== undefined
          ? header === "Files"
            ? `"${cellValue.replace(/"/g, '""')}"` 
            : typeof cellValue === "string"
              ? `"${cellValue.replace(/"/g, '""').replace(/\n/g, "\n")}"`
              : cellValue
          : "";
      })
      .join(","),
  ].join("\n");

  return csvContent;
}

export async function exportAllApplicationToCSV(
  applications,
  selectedFields = null
) {
  try {
    const filteredCampus = selectedFields.filter(
      (sf) => sf === "field_bristol_campus" || sf === "field_london_campus" || sf === "field_sheffield_campus" || sf === "field_birmingham_campus"
    );
    const selectedCampus =
      filteredCampus[0] === "field_bristol_campus"
        ? "Bristol"
        : filteredCampus[0] === "field_london_campus"
          ? "London"
            : filteredCampus[0] === "field_sheffield_campus"
            ? "Sheffield"
              : filteredCampus[0] === "field_birmingham_campus"
              ? "Birmingham"
                : undefined;

    const filteredApplications = selectedCampus
      ? applications.filter((app) => app.campus === selectedCampus)
      : applications;

    const now = new Date();

    const filename = `${selectedCampus ? `-${selectedCampus} Centre Applications` : "All Applications"}${" "}${dayjs(now).format("DD-MM-YYYY")}`;
    let excludeColumns = [];

    let headers =
      selectedFields && selectedFields.length > 0
        ? selectedFields
            .map((field) => {
              if (
                field === "field_bristol_campus" ||
                field === "field_london_campus" || 
                field === "field_sheffield_campus" ||
                field === "field_birmingham_campus"
              ) {
                return { label: "Campus", value: "campus" };
              }
              return applicationHeaders.find(
                (h) => h.id === field || h.value === field
              );
            })
            .filter(Boolean)
            .map((h) => h.label)
        : applicationHeaders
            .map((header) => header.label)
            .filter(
              (label) => label !== "Bristol Campus" && label !== "London Campus" && label !== "Sheffield Campus" && label !== "Birmingham Campus"
            );

    // Only add Campus after Commencement if we're exporting all fields
    if (!selectedFields || selectedFields.length === 0) {
      const commencementIndex = headers.indexOf("Commencement");
      if (commencementIndex !== -1) {
        headers.splice(commencementIndex + 1, 0, "Campus");
      }
    }
    // Handle Campus positioning for selected fields
    else if (headers.includes("Campus")) {
      const campusIndex = headers.indexOf("Campus");
      const studyModeIndex = headers.indexOf("Study Mode");
      const courseTitleIndex = headers.indexOf("Course Title");
      const idIndex = headers.indexOf("ID");

      // Remove Campus from its current position
      headers.splice(campusIndex, 1);

      // Insert it in the appropriate position
      if (studyModeIndex !== -1) {
        // After Study Mode if it exists
        headers.splice(studyModeIndex + 1, 0, "Campus");
      } else if (courseTitleIndex !== -1) {
        // After Course Title if Study Mode doesn't exist
        headers.splice(courseTitleIndex + 1, 0, "Campus");
      } else if (idIndex !== -1) {
        // After ID if neither Study Mode nor Course Title exist
        headers.splice(idIndex + 1, 0, "Campus");
      } else {
        // At the start if none of the above exist
        headers.unshift("Campus");
      }
    }

    let qualificationSets = 1;
    let pendingQualificationSets = 1;
    let workExperienceSets = 1;

    filteredApplications.forEach((data) => {
      if (
        !selectedFields ||
        selectedFields.length === 0 ||
        selectedFields.includes("qualifications")
      ) {
        if (
          data.qualifications &&
          data.qualifications.length > qualificationSets
        ) {
          for (
            let i = qualificationSets;
            i < Math.min(data.qualifications.length, 3);
            i++
          ) {
            headers.splice(
              headers.indexOf("Date Awarded") + 1 + (i - 1) * 5,
              0,
              `Qualification Title (${i + 1})`,
              `Examining Body (${i + 1})`,
              `Date Awarded (${i + 1})`,
              `Learner Reference (${i + 1})`,
              `Certificate Reference (${i + 1})`
            );
            qualificationSets++;
          }
        }
      }

      if (
        !selectedFields ||
        selectedFields.length === 0 ||
        selectedFields.includes("pendingQualifications")
      ) {
        if (
          data.hasPendingResults &&
          data.pendingQualifications &&
          data.pendingQualifications.length > pendingQualificationSets
        ) {
          for (
            let i = pendingQualificationSets;
            i < Math.min(data.pendingQualifications.length, 3);
            i++
          ) {
            if (i === 0) {
              headers.push(
                "(Pending) Qualification Title",
                "(Pending) Examining Body",
                "(Pending) Date of Results",
                "(Pending) Subjects Passed"
              );
            } else {
              headers.splice(
                headers.indexOf("(Pending) Subjects Passed") + 1 + (i - 1) * 4,
                0,
                `(Pending) Qualification Title (${i + 1})`,
                `(Pending) Examining Body (${i + 1})`,
                `(Pending) Date of Results (${i + 1})`,
                `(Pending) Subjects Passed (${i + 1})`
              );
            }
            pendingQualificationSets++;
          }
        }
      }

      if (
        !selectedFields ||
        selectedFields.length === 0 ||
        selectedFields.includes("workExperience")
      ) {
        if (
          data.hasWorkExperience &&
          data.workExperience &&
          data.workExperience.length > workExperienceSets
        ) {
          for (
            let i = workExperienceSets;
            i < Math.min(data.workExperience.length, 3);
            i++
          ) {
            if (i === 0) {
              headers.push(
                "Job Title",
                "Name of Organisation",
                "Nature of Job",
                "Job Start Date",
                "Job End Date"
              );
            } else {
              headers.splice(
                headers.indexOf("Job End Date") + 1 + (i - 1) * 5,
                0,
                `Job Title (${i + 1})`,
                `Name of Organisation (${i + 1})`,
                `Nature of Job (${i + 1})`,
                `Job Start Date (${i + 1})`,
                `Job End Date (${i + 1})`
              );
            }
            workExperienceSets++;
          }
        }
      }

      // Only exclude columns if specific fields are selected
      if (selectedFields && selectedFields.length > 0) {
        if (!data.hasPendingResults) {
          excludeColumns = [
            "(Pending) Qualification Title",
            "(Pending) Examining Body",
            "(Pending) Date of Results",
            "(Pending) Subjects Passed",
          ];
        }
        if (!data.hasWorkExperience) {
          excludeColumns.push(
            "Job Title",
            "Name of Organisation",
            "Nature of Job",
            "Job Start Date",
            "Job End Date"
          );
        }
      }

      // Exclude columns if they don't exist (optional fields)
      !data.entryDateToUK && excludeColumns.push("Entry Date to UK");
      !data.immigration_status && excludeColumns.push("Immigration Status");
      !data.share_code && excludeColumns.push("Share Code");
      !data.recruitment_agent &&
        excludeColumns.push("Name of Recruitment Agent");
    });

    // if (selectedFields && selectedFields.includes("files")) {
    //   headers.push("Files");
    // }

    headers = headers.filter((header) => !excludeColumns.includes(header));

    const csvContent = formatCsvContent(headers, filteredApplications.map((data) => {
      const fileUrls = collectFileUrls(data);
      return headers
        .map((header) => {
          let cellValue = "";

          try {
            if (header === "Campus") {
              cellValue = data.campus || "";
            } else if (header === "Files") {
              cellValue = fileUrls.join("\n");
            } else if (
              header === "Qualification Title" ||
              header === "Examining Body" ||
              header === "Date Awarded" ||
              header === "Learner Reference" ||
              header === "Certificate Reference"
            ) {
              if (data.qualifications && data.qualifications.length > 0) {
                cellValue =
                  header === "Date Awarded"
                    ? formatDateDDMMMYYYY(
                        data.qualifications[0][
                          applicationHeaders.find((h) => h.label === header)
                            .value
                        ]
                      )
                    : data.qualifications[0][
                        applicationHeaders.find((h) => h.label === header)
                          .value
                      ];
              }
            } else if (
              header.startsWith("Qualification Title (") ||
              header.startsWith("Examining Body (") ||
              header.startsWith("Date Awarded (") ||
              header.startsWith("Learner Reference (") ||
              header.startsWith("Certificate Reference (")
            ) {
              const index = parseInt(header.match(/\((\d+)\)/)[1]);
              const key = header.split(" (")[0].replace(/ /g, " ");
              if (data.qualifications && data.qualifications[index - 1]) {
                cellValue = header.startsWith("Date Awarded (")
                  ? formatDateDDMMMYYYY(
                      data.qualifications[index - 1][
                        applicationHeaders.find((h) => h.label === key).value
                      ]
                    )
                  : data.qualifications[index - 1][
                      applicationHeaders.find((h) => h.label === key).value
                    ];
              }
            } else if (
              header === "(Pending) Qualification Title" ||
              header === "(Pending) Examining Body" ||
              header === "(Pending) Date of Results" ||
              header === "(Pending) Subjects Passed"
            ) {
              if (
                data.pendingQualifications &&
                data.pendingQualifications.length > 0
              ) {
                cellValue =
                  header === "(Pending) Date of Results"
                    ? formatDateDDMMMYYYY(
                        data.pendingQualifications[0][
                          applicationHeaders.find((h) => h.label === header)
                            .value
                        ]
                      )
                    : data.pendingQualifications[0][
                        applicationHeaders.find((h) => h.label === header)
                          .value
                      ];
              }
            } else if (
              header.startsWith("(Pending) Qualification Title (") ||
              header.startsWith("(Pending) Examining Body (") ||
              header.startsWith("(Pending) Date of Results (") ||
              header.startsWith("(Pending) Subjects Passed (")
            ) {
              const index = parseInt(header.match(/\((\d+)\)/)[1]);
              const key = header.split(" (")[0].replace(/ /g, " ");
              if (
                data.pendingQualifications &&
                data.pendingQualifications[index - 1]
              ) {
                cellValue = header.startsWith("(Pending) Date of Results (")
                  ? formatDateDDMMMYYYY(
                      data.pendingQualifications[index - 1][
                        applicationHeaders.find((h) => h.label === key).value
                      ]
                    )
                  : data.pendingQualifications[index - 1][
                      applicationHeaders.find((h) => h.label === key).value
                    ];
              }
            } else if (
              header === "Job Title" ||
              header === "Name of Organisation" ||
              header === "Nature of Job" ||
              header === "Job Start Date" ||
              header === "Job End Date"
            ) {
              if (data.workExperience && data.workExperience.length > 0) {
                cellValue =
                  header === "Job Start Date" || header === "Job End Date"
                    ? formatDateDDMMMYYYY(
                        data.workExperience[0][
                          applicationHeaders.find((h) => h.label === header)
                            .value
                        ]
                      )
                    : data.workExperience[0][
                        applicationHeaders.find((h) => h.label === header)
                          .value
                      ];
              }
            } else if (
              header.startsWith("Job Title (") ||
              header.startsWith("Name of Organisation (") ||
              header.startsWith("Nature of Job (") ||
              header.startsWith("Job Start Date (") ||
              header.startsWith("Job End Date (")
            ) {
              const index = parseInt(header.match(/\((\d+)\)/)[1]);
              const key = header.split(" (")[0].replace(/ /g, " ");
              if (data.workExperience && data.workExperience[index - 1]) {
                cellValue =
                  header.startsWith("Job Start Date (") ||
                  header.startsWith("Job End Date (")
                    ? formatDateDDMMMYYYY(
                        data.workExperience[index - 1][
                          applicationHeaders.find((h) => h.label === key)
                            .value
                        ]
                      )
                    : data.workExperience[index - 1][
                        applicationHeaders.find((h) => h.label === key).value
                      ];
              }
            } else {
              const headerObj = applicationHeaders.find(
                (h) => h.id === header || h.label === header
              );
              if (headerObj) {
                const field = headerObj.value;
                cellValue = data[field];

                switch (field) {
                  case "id":
                    // Prefix the ID with an apostrophe to force it to be treated as text
                    cellValue = cellValue ? `'${cellValue}` : "";
                    break;
                  case "createdAt":
                  case "entryDateToUK":
                  case "dateOfBirth":
                    cellValue = formatDateDDMMMYYYY(cellValue);
                    break;
                  case "religion":
                    cellValue = getDisplayReligion(cellValue);
                    break;
                  case "studyMode":
                    cellValue = formatStudyMode(cellValue);
                    break;
                  case "ethnicity":
                    cellValue = getDisplayEthnicity(cellValue);
                    break;
                  case "immigration_status":
                    cellValue = formatImmigrationStatus(cellValue);
                    break;
                }
              }
            }
          } catch (error) {
            console.error(`Error processing field ${header}:`, error);
          }

          return cellValue !== undefined
            ? header === "Files"
              ? `"${cellValue.replace(/"/g, '""')}"` 
              : typeof cellValue === "string"
                ? `"${cellValue.replace(/"/g, '""').replace(/\n/g, "\n")}"`
                : cellValue
            : "";
        })
      }));

    return csvContent;
  } catch (error) {
    console.log("[EXPORTING_ALL_APPLICATIONS_ERROR]", error);
    return error;
  }
}

export async function exportStudentFinanceData(
  courseTitle,
  campus,
  commencement,
  slcStatus,
  month,
  year
) {
  try {
    const applications = await db.application.findMany({
      where: {
        courseTitle,
        campus,
        commencement,
        tuitionFees: "Student Loan Company England (SLC)",
        ...(slcStatus && {
          paymentPlan: {
            slcStatus
          }
        })
      },
      select: {
        title: true,
        firstName: true,
        lastName: true,
        gender: true,
        email: true,
        mobileNo: true,
        paymentPlan: {
          select: {
            crn: true,
            ssn: true,
            expectedPayments: true,
            slcStatus: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    if (applications.length === 0) {
      return null;
    }

    // Base headers that are always included
    const headers = [
      "Title",
      "First Name",
      "Last Name",
      "Gender",
      "Email",
      "Mobile Number",
      "CRN",
      "SLC Status",
    ];

    // Add conditional columns based on SLC status
    if (slcStatus === "Approved - Tuition Fees" || slcStatus === "Approved - Tuition Fees & Maintenance Loan") {
      headers.push("Tuition Fee Amount");
    }
    if (slcStatus === "Approved - Maintenance Loan" || slcStatus === "Approved - Tuition Fees & Maintenance Loan") {
      headers.push("Maintenance Loan Amount");
    }

    // Add university/course and payment columns only if not "In-process"
    if (slcStatus !== "In-process") {
      headers.push(
        "University/Course",
        "1st Payment Date",
        "1st Payment Amount",
        "2nd Payment Date",
        "2nd Payment Amount",
        "3rd Payment Date",
        "3rd Payment Amount"
      );
    }

    let rows = [];
    applications.forEach((app) => {
      let expectedPayments = [];

      if (app.paymentPlan && app.paymentPlan.expectedPayments) {
        expectedPayments = Array.isArray(app.paymentPlan.expectedPayments)
          ? [...app.paymentPlan.expectedPayments]
          : [];

        // Filter payments by month and year if specified
        if (month) {
          expectedPayments = expectedPayments.filter(payment => {
            if (!payment.date) return false;
            const paymentDate = new Date(payment.date);
            const currentYear = new Date().getFullYear();
            const matchesMonth = paymentDate.getMonth() === parseInt(month);
            const matchesYear = year 
              ? paymentDate.getFullYear() === parseInt(year)
              : paymentDate.getFullYear() === currentYear; // Use current year if no year specified
            return matchesMonth && matchesYear;
          });
          // Skip this application if it has no payments in the selected month/year
          if (expectedPayments.length === 0) {
            return;
          }
        }
      } else if (month) {
        // Skip applications with no payment plan when month is selected
        return;
      }

      // Get university/course from first payment if it exists
      const firstPayment = expectedPayments[0] || {};
      const universityAndCourse = [firstPayment.university, firstPayment.course]
        .filter(Boolean)
        .join(", ")
        .trim();

      // Format full name properly
      const formattedTitle = toTitleCase(app.title?.trim() || "");
      const formattedFirstName = toTitleCase(app.firstName?.trim() || "");
      const formattedLastName = toTitleCase(app.lastName?.trim() || "");

      // Base row data that's always included
      const rowData = [
        formattedTitle,
        formattedFirstName,
        formattedLastName,
        app.gender || "",
        (app.email || "").toLowerCase(),
        app.mobileNo || "",
        app.paymentPlan?.crn ? `="${app.paymentPlan.crn}"` : "",
        app.paymentPlan?.slcStatus || "",
      ];

      // Add conditional columns based on SLC status
      if (slcStatus === "Approved - Tuition Fees" || slcStatus === "Approved - Tuition Fees & Maintenance Loan") {
        rowData.push(app.paymentPlan?.tuitionFeeAmount ? `£${app.paymentPlan.tuitionFeeAmount}` : "");
      }
      if (slcStatus === "Approved - Maintenance Loan" || slcStatus === "Approved - Tuition Fees & Maintenance Loan") {
        rowData.push(app.paymentPlan?.maintenanceLoanAmount ? `£${app.paymentPlan.maintenanceLoanAmount}` : "");
      }

      // Add university/course and payments only if not "In-process"
      if (slcStatus !== "In-process") {
        rowData.push(universityAndCourse);

        // Initialize empty payment slots
        const paymentSlots = [
          ["", ""], // 1st payment
          ["", ""], // 2nd payment
          ["", ""]  // 3rd payment
        ];

        // Process each payment and keep its original position
        if (app.paymentPlan?.expectedPayments) {
          // Ensure expectedPayments is an array and preserve original order
          const payments = Array.isArray(app.paymentPlan.expectedPayments)
            ? [...app.paymentPlan.expectedPayments]
            : [];

          // Process each payment in its original order
          payments.forEach((payment, index) => {
            // Skip if no date or beyond 3rd payment
            if (!payment.date || index >= 3) return;

            // If month is selected, check if this payment is in the selected month
            if (month && payment.date) {
              const paymentDate = new Date(payment.date);
              if (paymentDate.getMonth() !== parseInt(month)) {
                return; // Skip payments not in selected month
              }
            }

            // Format the payment data
            const formattedPayment = [
              new Date(payment.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }).replace(/ /g, '-'),
              payment.amount ? `£${payment.amount}` : ""
            ];

            // Keep the payment in its original position
            paymentSlots[index] = formattedPayment;
          });
        }

        rowData.push(...paymentSlots.flat());
      }

      rows.push(rowData.map((field) => `"${(field || "").replace(/"/g, '""')}"`));
    });

    rows = rows.map(row => row.join(","));
    return [headers.join(","), ...rows].join("\n");
  } catch (error) {
    console.error("[EXPORT_FINANCE_DATA_ERROR]", error);
    throw error;
  }
}

export async function exportStudentFinanceByDateRange(dateRange) {
  try {
    // Get all applications with their payment plans
    const applications = await db.application.findMany({
      where: {
        paymentPlan: {
          isNot: null,
        },
      },
      select: {
        firstName: true,
        lastName: true,
        title: true,
        dateOfBirth: true,
        courseTitle: true,
        paymentPlan: {
          select: {
            crn: true,
            ssn: true,
            expectedPayments: true,
          }
        }
      },
    });

    if (!applications || applications.length === 0) {
      return null;
    }

    // Process applications and their payments
    const processedData = [];
    applications.forEach(app => {
      if (!app.paymentPlan?.expectedPayments) return;
      
      const payments = app.paymentPlan.expectedPayments;
      
      // Filter payments by date range
      payments.forEach((payment, index) => {
        if (!payment.date) return;
        const paymentDate = new Date(payment.date);
        const from = new Date(dateRange.from);
        const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        
        if (paymentDate >= from && paymentDate <= to) {
          // Format full name properly
          const fullName = formatFullName(
            app.title || "",
            app.firstName || "",
            app.lastName || ""
          );

          processedData.push({
            courseTitle: app.courseTitle || "Unknown Course",
            fullName,
            dateOfBirth: app.dateOfBirth ? formatDateTime(app.dateOfBirth).dateShort : "",
            crn: `="${app.paymentPlan.crn}"` || "",
            ssn: app.paymentPlan?.ssn || "",
            paymentAmount: payment.amount ? `£${payment.amount}` : "",
            paymentDate: payment.date ? formatDateTime(payment.date).dateShort : "",
            paymentOrder: index + 1,
            firstName: app.firstName?.trim() || "", // For sorting
          });
        }
      });
    });

    if (processedData.length === 0) {
      return null;
    }

    // Group data by course title and calculate totals
    const groupedData = processedData.reduce((acc, item) => {
      if (!acc[item.courseTitle]) {
        acc[item.courseTitle] = {
          payments: [],
          total: 0
        };
      }
      
      // Parse amount correctly - remove pound sign and commas, then convert to float
      const amount = parseFloat(item.paymentAmount.replace(/[£,]/g, '')) || 0;
      
      acc[item.courseTitle].total += amount;
      acc[item.courseTitle].payments.push(item);
      return acc;
    }, {});

    const sortedCourses = Object.keys(groupedData).sort();
    const headers = [
      "S.#",
      "Full Name",
      "DOB",
      "CRN",
      "SSN",
      "Payment Amount",
      "Date of Payment"
    ];

    let csvRows = [];
    let grandTotal = 0;

    sortedCourses.forEach(course => {
      const courseData = groupedData[course];
      
      csvRows.push([`${course} (${courseData.payments.length} payments)`]);
      
      const modifiedHeaders = headers.map(header => {
        if (header === "Payment Amount") return `(${getOrdinalSuffix(courseData.payments[0].paymentOrder)}) Payment Amount`;
        if (header === "Date of Payment") return `(${getOrdinalSuffix(courseData.payments[0].paymentOrder)}) Date of Payment`;
        return header;
      });
      csvRows.push(modifiedHeaders);

      // Sort students by first name within each course
      const sortedPayments = courseData.payments.sort((a, b) => 
        a.firstName.localeCompare(b.firstName)
      );

      let courseIndex = 1;
      sortedPayments.forEach(payment => {
        csvRows.push([
          courseIndex++,
          payment.fullName,
          payment.dateOfBirth,
          payment.crn,
          payment.ssn,
          payment.paymentAmount,
          payment.paymentDate
        ]);
      });

      // Add course total to grand total
      grandTotal += courseData.total;
      csvRows.push([]);
    });

    // Add summary section
    csvRows.push(['Summary Section']);
    csvRows.push(['Course', 'Total Amount']);
    sortedCourses.forEach(course => {
      csvRows.push([
        course,
        formatCurrency(groupedData[course].total)
      ]);
    });
    csvRows.push(['Grand Total', formatCurrency(grandTotal)]);

    // Convert to CSV format
    return formatCsvContent([], csvRows);
  } catch (error) {
    console.error("[EXPORT_STUDENT_FINANCE_ERROR]", error);
    return null;
  }
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (k === 11 || k === 12 || k === 13) return num + "th";
  if (j === 1) return num + "st";
  if (j === 2) return num + "nd";
  if (j === 3) return num + "rd";
  return num + "th";
}

export function exportTableToCSV(table, columns, opts) {
  const {
    filename = "table",
    excludeColumns = [],
    onlySelected = false,
  } = opts;

  // Get all the keys from the first data item
  const headers = columns
    .filter((col) => !excludeColumns.includes(col.accessorKey))
    .map((col) => ({
      key: col.accessorKey,
      header: col.header,
    }));

  // Build CSV content
  const csvContent = formatCsvContent(headers.map(h => h.header), table.map((item) => {
    const hasOnDemandInstance = item.course_instances?.some(
      instance => instance.instance_name === "On Demand"
    );

    return headers.map((col) => {
      let value = item[col.key];

      // Handle dates for On Demand courses
      if (hasOnDemandInstance && ['startDate', 'endDate', 'last_join_date', 'results_date'].includes(col.key)) {
        const dates = formatCourseDates(item);
        return dates[col.key];
      }

      // Format dates if needed
      if (col.type === 'date' && value) {
        return formatDateDDMMMYYYY(value);
      }

      // Format currency if needed
      if (col.type === 'currency' && value) {
        return `£${value.toLocaleString('en-GB', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      }

      return value || '';
    });
  }));

  return csvContent;
}

export async function exportStudentData(
  applications,
  { courseTitle, campus, commencement, enrollmentStatus }
) {
  try {
    if (applications.length === 0) {
      return { error: "No applications found matching the criteria" };
    }

    // Define headers for the CSV
    const headers = [
      "S.#",
      "Student ID",
      "Title",
      "First Name",
      "Last Name",
      "Gender",
      "Address",
      "Zip / Postal Code",
      "Mobile No.",
      "Email",
      "Date of Birth",
      "Emergency Contact Name",
      "Emergency Contact No.",
      "Name of Recruitment Agent",
      "Course Title",
      "Campus",
      "Commencement",
    ];

    // Create CSV content
    const csvContent = formatCsvContent(
      headers,
      applications.map((app, index) => {
        // Combine and format address fields
        const address = formatAddress(
          [app.addressLine1, app.addressLine2, app.city]
            .filter(Boolean)
            .join(", ")
        );

        // Format date of birth as DD-MMM-YYYY
        const dob = app.dateOfBirth ? formatDateDDMMMYYYY(app.dateOfBirth) : "";

        // Format full name properly
        const fullName = formatFullName(
          app.title || "",
          app.firstName || "",
          app.lastName || ""
        );

        // Get student ID - use enrolledStudent ID for enrolled students, user ID for non-enrolled
        const studentId = app.enrolledStudent?.id || app.user?.id || "";

        return [
          (index + 1).toString(),
          studentId,
          toTitleCase(app.title) || "",
          toTitleCase(app.firstName) || "",
          toTitleCase(app.lastName) || "",
          toTitleCase(app.gender) || "",
          address,
          formatPostcode(app.postcode) || "",
          app.mobileNo || "",
          app.email?.toLowerCase() || "",
          dob,
          toTitleCase(app.emergency_contact_name) || "",
          app.emergency_contact_no || "",
          toTitleCase(app.recruitment_agent) || "",
          courseTitle || "",
          campus || "",
          commencement || "",
        ];
      })
    );

    return csvContent;
  } catch (error) {
    console.error("[EXPORT_STUDENT_DATA_ERROR]", error);
    return { error: error.message || "Failed to export student data" };
  }
}

export async function exportAwardingBodyToExcel(
  applications,
  { courseTitle, campus, commencement, awardingBody }
) {
  try {
    if (applications.length === 0) {
      return { error: "No applications found matching the criteria" };
    }

    const XLSX = require("xlsx-js-style");
    const workbook = XLSX.utils.book_new();

    // Prepare data
    const headers = [
      "Student Name",
      "Date of Birth",
      "AB Registration No.",
      "AB Registration Date",
      "Status",
    ];

    // Separate registered and unregistered students
    const registeredStudents = [];
    const unregisteredStudents = [];

    applications.forEach((app) => {
      // Create full name in "lastName, firstName" format for sorting
      const fullName = formatFullName("", app.firstName, app.lastName);
      const isRegistered = app.ab_registration_no && app.ab_registration_date;
      const studentData = [
        fullName,
        app.dateOfBirth ? formatDateDDMMMYYYY(app.dateOfBirth) : "",
        app.ab_registration_no || "",
        app.ab_registration_date
          ? formatDateDDMMMYYYY(app.ab_registration_date)
          : "",
        isRegistered ? "Registered" : "Not Registered",
      ];

      if (isRegistered) {
        registeredStudents.push(studentData);
      } else {
        unregisteredStudents.push(studentData);
      }
    });

    // Sort by full name
    registeredStudents.sort((a, b) => a[0].localeCompare(b[0]));
    unregisteredStudents.sort((a, b) => a[0].localeCompare(b[0]));

    // Create worksheet data
    const wsData = [
      ["Awarding Body Registration Report"], // A1
      ["Course:", courseTitle || "All"], // A2
      ["Campus:", campus || "All"], // A3
      ["Commencement:", commencement || "All"], // A4
      ["Awarding Body:", awardingBody], // A5
      [], // A6
      headers, // A7
      ["Registered Students"], // A8
      ...registeredStudents,
      [],
      ["Unregistered Students"],
      ...unregisteredStudents,
      [],
      ["Summary"],
      ["Total Students", applications.length],
      ["Registered", registeredStudents.length],
      ["Not Registered", unregisteredStudents.length],
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for title
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge A1:E1
    ];

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Student Name
      { wch: 15 }, // Date of Birth
      { wch: 20 }, // AB Registration No
      { wch: 15 }, // Registration Date
      { wch: 15 }, // Status
    ];

    // Apply styles to specific cells
    // Title
    ws.A1.s = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "4477CE" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    // Filter information styling
    const filterLabelStyle = {
      font: { bold: true, sz: 11, color: { rgb: "000000" } },
      alignment: { horizontal: "left", vertical: "center" },
      fill: { patternType: "solid", fgColor: { rgb: "F0F0F0" } },
    };

    const filterValueStyle = {
      font: { sz: 11, color: { rgb: "000000" } },
      alignment: { horizontal: "left", vertical: "center" },
    };

    // Apply filter styles
    for (let row = 1; row <= 4; row++) {
      // Style label cells (A2-A5)
      const labelCell = XLSX.utils.encode_cell({ r: row, c: 0 });
      ws[labelCell].s = filterLabelStyle;

      // Style value cells (B2-B5)
      const valueCell = XLSX.utils.encode_cell({ r: row, c: 1 });
      ws[valueCell].s = filterValueStyle;

      // Add some padding after filters
      if (row === 4) {
        const spacerRow = XLSX.utils.encode_cell({ r: row + 1, c: 0 });
        if (!ws[spacerRow]) ws[spacerRow] = { v: "" };
      }

      // Merge value cells across remaining columns
      ws["!merges"].push({
        s: { r: row, c: 1 },
        e: { r: row, c: 4 },
      });
    }

    // Headers (A7:E7)
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "2B3467" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };

    // Apply header styles
    for (let i = 0; i < headers.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 6, c: i });
      ws[cellRef].s = headerStyle;
    }

    // Section headers style
    const sectionStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "4477CE" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    // Find and style section headers and center their data
    for (let i = 0; i < wsData.length; i++) {
      const row = wsData[i];
      if (
        row[0] === "Registered Students" ||
        row[0] === "Unregistered Students"
      ) {
        // Style section header
        ws[XLSX.utils.encode_cell({ r: i, c: 0 })].s = sectionStyle;
        // Merge section header across all columns
        ws["!merges"].push({
          s: { r: i, c: 0 },
          e: { r: i, c: 4 },
        });
      } else if (row.length === headers.length) {
        // This is a data row under a section, center align all cells
        for (let j = 0; j < row.length; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              alignment: { horizontal: "center", vertical: "center" },
            };
          }
        }
      }
    }

    // Find and style summary section
    let summaryRow = wsData.findIndex((row) => row[0] === "Summary");
    if (summaryRow !== -1) {
      const summaryStyle = {
        font: { bold: true },
        fill: { patternType: "solid", fgColor: { rgb: "E8F1F5" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      // Apply to Summary header and its data rows
      for (let i = summaryRow; i < summaryRow + 4; i++) {
        for (let j = 0; j < 2; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (ws[cellRef]) {
            ws[cellRef].s = summaryStyle;
          }
        }
      }
    }

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, ws, "Awarding Body Report");

    // Generate buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buf;
  } catch (error) {
    console.error("[EXPORT_AWARDING_BODY_EXCEL_ERROR]", error);
    return { error: error.message || "Failed to export data" };
  }
}

// Add a simple fuzzy matching function
function fuzzyMatch(text, pattern) {
  if (!text || !pattern) return false;

  // Convert both to lowercase for case-insensitive matching
  const textLower = text.toString().toLowerCase();
  const patternLower = pattern.toString().toLowerCase();

  // Direct match
  if (textLower === patternLower) return true;

  // Contains match
  if (textLower.includes(patternLower) || patternLower.includes(textLower))
    return true;

  // Simple character-based similarity (allow for small typos)
  let matchCount = 0;
  const minLength = Math.min(textLower.length, patternLower.length);

  // If lengths are very different, it's likely not a match
  if (Math.abs(textLower.length - patternLower.length) > 3) return false;

  // Count matching characters
  for (let i = 0; i < minLength; i++) {
    if (textLower[i] === patternLower[i]) matchCount++;
  }

  // If more than 70% of characters match, consider it a potential match
  return matchCount / minLength > 0.7;
}

/**
 * Normalizes recruitment agent information to standardize variations
 * @param {string} agentInfo The raw agent information as stored in the database
 * @returns {string} The normalized agent code
 */
function normalizeRecruitmentAgent(agentInfo) {
  if (!agentInfo) return "No Agent";

  const agentInfoLower = agentInfo.toString().toLowerCase().trim();

  // Try to find a matching agent by patterns
  for (const agent of RECRUITMENT_AGENTS) {
    // Skip agents without a code
    if (!agent.code) continue;

    // Direct code match
    if (agentInfoLower === agent.code.toString()) {
      return agent.code.toString();
    }

    // Check against patterns with fuzzy matching
    for (const pattern of agent.patterns) {
      if (fuzzyMatch(agentInfoLower, pattern.toLowerCase())) {
        return agent.code.toString();
      }
    }

    // Check if agent starts with code (like "201mario")
    if (agentInfoLower.startsWith(agent.code.toString())) {
      return agent.code.toString();
    }
  }

  // If no match found by code, try to match by name or pattern only
  for (const agent of RECRUITMENT_AGENTS) {
    // Skip agents that have a code (already checked above)
    if (agent.code) continue;

    // Check if agent name is in the info with fuzzy matching
    if (agent.name && fuzzyMatch(agentInfoLower, agent.name.toLowerCase())) {
      return agent.name; // Use name as identifier
    }

    // Check against patterns with fuzzy matching
    for (const pattern of agent.patterns || []) {
      if (fuzzyMatch(agentInfoLower, pattern.toLowerCase())) {
        return agent.name; // Use name as identifier
      }
    }
  }

  // If no match found, extract any numeric code at the beginning
  const codeMatch = agentInfoLower.match(/^(\d+)/);
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1];
  }

  // If we have a value but no match was found, return the original agent name
  return agentInfo;
}

/**
 * Export interviews to Excel with proper styling
 * @param {Array} interviews - Array of interview data
 * @param {Object} filters - Filter criteria
 * @returns {ExcelJS.Workbook} - Excel workbook
 */
export async function exportInterviews(
  interviews,
  { courseTitle, campus, commencement, status, dateRange }
) {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Process interviews data for export
    const processedData = interviews.map((interview) => {
      const application = interview.application;
      const user = application?.user;

      // Trim whitespace from names
      const firstName = application?.firstName
        ? application.firstName.trim()
        : "";
      const lastName = application?.lastName ? application.lastName.trim() : "";

      const rawRecruitmentAgent = application?.recruitment_agent || "No Agent";

      // Normalize the recruitment agent
      const normalizedAgentCode =
        normalizeRecruitmentAgent(rawRecruitmentAgent);

      return {
        applicationID: application?.id || "N/A",
        firstName: firstName,
        lastName: lastName,
        email: user?.email || "",
        courseTitle: application?.courseTitle || "",
        campus: application?.campus || "",
        commencement: application?.commencement || "",
        date: interview.date ? formatDateTime(interview.date).dateTime : "N/A",
        status: interview.status
          ? interview.status.charAt(0).toUpperCase() + interview.status.slice(1)
          : "Pending",
        recruitmentAgent: normalizedAgentCode, // Use the normalized agent code
      };
    });

    // Sort the processed data alphabetically by firstName
    processedData.sort((a, b) => {
      // Convert to lowercase for case-insensitive comparison
      const firstNameA = a.firstName.toLowerCase();
      const firstNameB = b.firstName.toLowerCase();

      // First sort by firstName
      if (firstNameA < firstNameB) return -1;
      if (firstNameA > firstNameB) return 1;

      // If firstNames are the same, sort by lastName
      const lastNameA = a.lastName.toLowerCase();
      const lastNameB = b.lastName.toLowerCase();

      if (lastNameA < lastNameB) return -1;
      if (lastNameA > lastNameB) return 1;

      return 0;
    });

    // Create a sheet for all interviews
    const allInterviewsSheet = workbook.addWorksheet("All Interviews");

    // Function to create and format a sheet
    const createAndFormatSheet = (
      sheetName,
      dataToExport,
      existingSheet = null
    ) => {
      // Use existing sheet if provided, otherwise create a new one
      const sheet = existingSheet || workbook.addWorksheet(sheetName);

      // Set sheet name only if it's a new sheet
      if (!existingSheet) {
        sheet.name = sheetName;
      }

      // Title row with report details
      const titleRow = sheet.addRow(["Interview Export"]);
      titleRow.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      titleRow.getCell(1).alignment = { horizontal: "center" };
      titleRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4477CE" },
      };

      // Determine if this is the main sheet or an agent-specific sheet
      const isMainSheet = sheetName === "All Interviews";

      // Set the correct merge cells range
      if (isMainSheet) {
        sheet.mergeCells("A1:F1"); // Title row
      } else {
        sheet.mergeCells("A1:E1"); // Title row for agent sheets (no recruitment agent column)
      }

      // Add empty row
      sheet.addRow([]);

      // Add filter headers with dark grey labels and no background for values - each on its own line
      sheet.addRow(["Course:", courseTitle || "All"]);
      sheet.addRow(["Campus:", campus || "All"]);
      sheet.addRow(["Commencement:", commencement || "All"]);
      sheet.addRow([
        "Status:",
        status ? (status.charAt(0).toUpperCase() + status.slice(1)) : "All",
      ]);
      sheet.addRow([
        "Date Range:",
        dateRange
          ? `${formatDateTime(new Date(dateRange.from)).dateShort} - ${dateRange.to ? formatDateTime(new Date(dateRange.to)).dateShort : "Present"}`
          : "All",
      ]);

      // Style filter labels with dark grey, bold text
      for (let i = 3; i <= 7; i++) {
        const row = sheet.getRow(i);
        const labelCell = row.getCell(1);
        labelCell.font = { bold: true };
        labelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "EBEBEB" },
        };
      }

      // Add empty row
      sheet.addRow([]);

      // Column headers - exclude Recruitment Agent for agent-specific sheets
      let headers = [
        "Application ID",
        "First Name",
        "Last Name",
        "Interview Date",
        "Status",
      ];

      // Add Recruitment Agent column only for the main sheet
      if (isMainSheet) {
        headers.push("Recruitment Agent");
      }

      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4477CE" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: false,
        };
      });

      // Add data rows
      dataToExport.forEach((data) => {
        // Create row data array based on whether it's the main sheet or agent sheet
        let rowData = [
          data.applicationID,
          data.firstName,
          data.lastName,
          data.date,
          data.status,
        ];

        // Add Recruitment Agent column only for the main sheet
        if (isMainSheet) {
          rowData.push(data.recruitmentAgent);
        }

        const row = sheet.addRow(rowData);
      });

      // Auto-size columns
      sheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      return sheet;
    };

    // Create the main sheet with all interviews
    createAndFormatSheet("All Interviews", processedData, allInterviewsSheet);

    // Group interviews by recruitment agent
    const groupedByAgent = {};

    // Initialize a map of recruitment agent codes to their corresponding data
    processedData.forEach((data) => {
      const agentIdentifier = data.recruitmentAgent;
      if (!groupedByAgent[agentIdentifier]) {
        groupedByAgent[agentIdentifier] = [];
      }
      groupedByAgent[agentIdentifier].push(data);
    });

    // Create individual sheets for each recruitment agent
    Object.entries(groupedByAgent).forEach(([agentCode, agentData]) => {
      if (agentCode === "No Agent" && agentData.length > 0) {
        createAndFormatSheet("No Agent", agentData);
      } else {
        // Create a valid sheet name
        let sheetName = "";

        // First try to find agent by code (if agentIdentifier is a number)
        const isNumericCode = !isNaN(agentCode);

        if (isNumericCode) {
          // Find the agent name from the code
          const agent = RECRUITMENT_AGENTS.find(
            (a) => a.code && a.code.toString() === agentCode.toString()
          );

          if (agent) {
            // Use the agent name with code and organization in parentheses if found by code
            const orgText = agent.organization
              ? ` - ${agent.organization}`
              : "";
            sheetName = `${agent.name}${orgText} (${agent.code})`;
          } else {
            // If no matching agent found but we have a code, use a generic name with code
            sheetName = `Agent ${agentCode}`;
          }
        } else {
          // If agentIdentifier is not a number, it's likely an agent name
          // Find if this agent has a code in the RECRUITMENT_AGENTS array
          const agent = RECRUITMENT_AGENTS.find((a) => a.name === agentCode);

          if (agent && agent.code) {
            // If the agent has a code, append it to the name along with organization if available
            const orgText = agent.organization
              ? ` - ${agent.organization}`
              : "";
            sheetName = `${agentCode}${orgText} (${agent.code})`;
          } else {
            // Otherwise just use the name
            sheetName = agentCode;
          }
        }

        // Ensure sheet name is valid (max 31 chars for Excel)
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 28) + "...";
        }

        // Create and add the sheet for this agent
        createAndFormatSheet(sheetName, agentData);
      }
    });

    return workbook;
  } catch (error) {
    console.error("Error in exportInterviews:", error);
    throw error;
  }
}
