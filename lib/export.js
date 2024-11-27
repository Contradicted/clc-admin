import { applicationHeaders } from "@/constants";
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

export function exportApplicationToCSV(data) {
  const filename = `application-${data.id}`;
  let excludeColumns = [];

  let headers = [
    ...applicationHeaders
      .filter(
        (header) => !["Bristol Campus", "London Campus"].includes(header.label)
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
  !data.recruitment_agent && excludeColumns.push("Name of Recruitment Agent");

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
          header === "Date Awarded"
        ) {
          cellValue =
            header === "Date Awarded"
              ? formatDateTime(
                  data.qualifications[0][
                    applicationHeaders.find((h) => h.label === header).value
                  ]
                ).dateLong
              : data.qualifications[0][
                  applicationHeaders.find((h) => h.label === header).value
                ];
        } else if (
          header.startsWith("Qualification Title (") ||
          header.startsWith("Examining Body (") ||
          header.startsWith("Date Awarded (")
        ) {
          const index = parseInt(header.match(/\((\d+)\)/)[1]);
          const key = header.split(" (")[0].replace(/ /g, " ");
          cellValue = header.startsWith("Date Awarded (")
            ? formatDateTime(
                data.qualifications[index - 1][
                  applicationHeaders.find((h) => h.label === key).value
                ]
              ).dateLong
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
              ? formatDateTime(
                  data.pendingQualifications[0][
                    applicationHeaders.find((h) => h.label === header).value
                  ]
                ).dateLong
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
            ? formatDateTime(
                data.pendingQualifications[index - 1][
                  applicationHeaders.find((h) => h.label === key).value
                ]
              ).dateLong
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
              ? formatDateTime(
                  data.workExperience[0][
                    applicationHeaders.find((h) => h.label === header).value
                  ]
                ).dateLong
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
              ? formatDateTime(
                  data.workExperience[index - 1][
                    applicationHeaders.find((h) => h.label === key).value
                  ]
                ).dateLong
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
              cellValue = formatDateTime(cellValue).dateLong;
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
              cellValue = formatDateTime(cellValue).dateLong;
              break;
            case "immigration_status":
              cellValue = formatImmigrationStatus(cellValue);
              break;
            case "createdAt":
              cellValue = formatDateTime(cellValue).dateLong;
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

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary anchor element to trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAllApplicationToCSV(
  applications,
  selectedFields = null
) {
  try {
    const filteredCampus = selectedFields.filter(
      (sf) => sf === "field_bristol_campus" || sf === "field_london_campus"
    );
    const selectedCampus =
      filteredCampus[0] === "field_bristol_campus"
        ? "Bristol"
        : filteredCampus[0] === "field_london_campus"
          ? "London"
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
                field === "field_london_campus"
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
              (label) => label !== "Bristol Campus" && label !== "London Campus"
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
              headers.indexOf("Date Awarded") + 1 + (i - 1) * 3,
              0,
              `Qualification Title (${i + 1})`,
              `Examining Body (${i + 1})`,
              `Date Awarded (${i + 1})`
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
      // !data.entryDateToUK && excludeColumns.push("Entry Date to UK");
      // !data.immigration_status && excludeColumns.push("Immigration Status");
      // !data.share_code && excludeColumns.push("Share Code");
      // !data.recruitment_agent &&
      //   excludeColumns.push("Name of Recruitment Agent");
    });

    // if (selectedFields && selectedFields.includes("files")) {
    //   headers.push("Files");
    // }

    headers = headers.filter((header) => !excludeColumns.includes(header));

    const csvContent = [
      headers.join(","),
      ...filteredApplications.map((data) => {
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
                header === "Date Awarded"
              ) {
                if (data.qualifications && data.qualifications.length > 0) {
                  cellValue =
                    header === "Date Awarded"
                      ? formatDateTime(
                          data.qualifications[0][
                            applicationHeaders.find((h) => h.label === header)
                              .value
                          ]
                        ).dateLong
                      : data.qualifications[0][
                          applicationHeaders.find((h) => h.label === header)
                            .value
                        ];
                }
              } else if (
                header.startsWith("Qualification Title (") ||
                header.startsWith("Examining Body (") ||
                header.startsWith("Date Awarded (")
              ) {
                const index = parseInt(header.match(/\((\d+)\)/)[1]);
                const key = header.split(" (")[0].replace(/ /g, " ");
                if (data.qualifications && data.qualifications[index - 1]) {
                  cellValue = header.startsWith("Date Awarded (")
                    ? formatDateTime(
                        data.qualifications[index - 1][
                          applicationHeaders.find((h) => h.label === key).value
                        ]
                      ).dateLong
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
                      ? formatDateTime(
                          data.pendingQualifications[0][
                            applicationHeaders.find((h) => h.label === header)
                              .value
                          ]
                        ).dateLong
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
                    ? formatDateTime(
                        data.pendingQualifications[index - 1][
                          applicationHeaders.find((h) => h.label === key).value
                        ]
                      ).dateLong
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
                      ? formatDateTime(
                          data.workExperience[0][
                            applicationHeaders.find((h) => h.label === header)
                              .value
                          ]
                        ).dateLong
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
                      ? formatDateTime(
                          data.workExperience[index - 1][
                            applicationHeaders.find((h) => h.label === key)
                              .value
                          ]
                        ).dateLong
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
                      cellValue = cellValue
                        ? formatDateTime(cellValue).dateLong
                        : "";
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
          .join(",");
      }),
    ].join("\n");

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary anchor element to trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.log("[EXPORTING_ALL_APPLICATIONS_ERROR]", error);
    return error;
  }
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
  const csvContent = [
    headers.map((h) => h.header).join(","),
    ...table.map((row) =>
      headers
        .map(({ key }) => {
          let cellValue =
            key === "createdAt"
              ? formatDateTime(row[key]).dateLong
              : key === "date"
                ? formatDateTime(row[key]).dateTime
                : row[key]; // Removed special status handling as it's now pre-formatted

          return typeof cellValue === "string"
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary anchor element to trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  const csvContent = [
    headers.map((h) => h.header).join(","),
    ...table.map((row) =>
      headers
        .map(({ key }) => {
          let cellValue =
            key === "createdAt"
              ? formatDateTime(row[key]).dateLong
              : key === "date"
                ? formatDateTime(row[key]).dateTime
                : row[key]; // Removed special status handling as it's now pre-formatted

          return typeof cellValue === "string"
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary anchor element to trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
            slcStatus: true,
            tuitionFeeAmount: true,
            maintenanceLoanAmount: true,
            expectedPayments: true,
          },
        },
      },
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

      // Base row data that's always included
      const rowData = [
        toTitleCase(app.title || ""),
        toTitleCase(app.firstName || ""),
        toTitleCase(app.lastName || ""),
        app.gender || "",
        (app.email || "").toLowerCase(),
        app.mobileNo || "",
        app.paymentPlan?.crn || "",
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

        // Add all payment slots to the row
        rowData.push(...paymentSlots.flat());
      }

      rows.push(rowData.map((field) => `"${(field || "").replace(/"/g, '""')}"`));
    });

    // Format all fields as CSV cells
    rows = rows.map(row => row.join(","));

    return [headers.join(","), ...rows].join("\n");
  } catch (error) {
    console.error("[EXPORT_FINANCE_DATA_ERROR]", error);
    throw error;
  }
}

export async function exportStudentData(
  applications,
  { courseTitle, campus, commencement }
) {
  try {
    if (applications.length === 0) {
      return { error: "No applications found matching the criteria" };
    }

    // Define headers for the CSV
    const headers = [
      "Title",
      "First Name",
      "Last Name",
      "Gender",
      "Address",
      "Postcode",
      "Email",
      "Mobile No",
      "Emergency Contact Name",
      "Emergency Contact Number",
    ];

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...applications.map((app) => {
        // Combine and format address fields
        const address = formatAddress(
          [app.addressLine1, app.addressLine2, app.city]
            .filter(Boolean)
            .join(", ")
        );

        return [
          toTitleCase(app.title) || "",
          toTitleCase(app.firstName) || "",
          toTitleCase(app.lastName) || "",
          app.gender || "",
          `"${address}"`,
          formatPostcode(app.postcode) || "",
          app.email?.toLowerCase() || "",
          app.mobileNo || "",
          toTitleCase(app.emergency_contact_name) || "",
          app.emergency_contact_no || "",
        ].join(",");
      }),
    ].join("\n");

    return { csvContent, error: null };
  } catch (error) {
    console.error("[EXPORT_STUDENT_DATA_ERROR]", error);
    return { error: error.message || "Failed to export student data" };
  }
}
