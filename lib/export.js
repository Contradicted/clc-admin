import { applicationHeaders } from "@/constants";
import {
  formatDateTime,
  formatImmigrationStatus,
  formatStudyMode,
  getDisplayEthnicity,
  getDisplayReligion,
} from "./utils";

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

  let headers = [...applicationHeaders.map((header) => header.label), "Files"];

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
          ? typeof cellValue === "string"
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

export function exportTableToCSV(table, opts) {
  const {
    filename = "table",
    excludeColumns = [],
    onlySelected = false,
  } = opts;

  const headers = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((id) => !excludeColumns.includes(id));

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map((row) =>
      headers
        .map((header) => {
          const cellValue =
            header === "createdAt"
              ? formatDateTime(row.getValue(header)).dateLong
              : row.getValue(header);

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
