import {
  BookOpenIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileUpIcon,
  TrashIcon,
  CreditCardIcon,
  CalendarIcon,
  MailIcon,
  GraduationCapIcon,
  UserIcon,
  DownloadIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  Timeline,
  TimelineContent,
  TimelineItem,
} from "@/components/ui/timeline";

function getActionIcon(action) {
  // Handle non-generic cases first
  const specificIcons = {
    EMAIL_SENT: MailIcon,
    INTERVIEW_SCHEDULED: CalendarIcon,
  };

  if (specificIcons[action]) {
    return specificIcons[action];
  }

  let icons = {};

  switch (true) {
    case action.startsWith("UPDATE_"):
      icons[action] = PencilIcon;
      break;
    case action.startsWith("ADD_"):
      icons[action] = PlusIcon;
      break;
    case action.startsWith("DELETE_"):
      icons[action] = TrashIcon;
      break;
    case action.startsWith("DOWNLOAD_"):
      icons[action] = DownloadIcon;
      break;
    default:
      icons[action] = PlusIcon;
      break;
  }

  return icons[action];
}

function getActionText(action) {
  const texts = {
    UPDATE_APPLICATION_STATUS: "Updated application status",
    UPDATE_COURSE_DETAILS: "Updated course details",
    UPDATE_PERSONAL_DETAILS: "Updated personal details",
    UPDATE_STUDENT_FINANCE: "Updated student finance",
    UPDATE_QUALIFICATIONS: "Updated qualifications",
    UPDATE_WORK_EXPERIENCE: "Updated work experience",
    UPDATE_ADDITIONAL_INFO: "Updated additional info",
    UPDATE_INTERVIEW: "Updated interview",
    EXPORT_APPLICATION: "Exported application data",
    DOWNLOAD_FILES: "Downloaded files",
    ADD_FILE: "Added file",
    DELETE_FILE: "Deleted file",
    ADD_NOTE: "Added note",
    ADD_QUALIFICATION: "Added qualification",
    ADD_WORK_EXPERIENCE: "Added work experience",
    ADD_PENDING_QUALIFICATION: "Added pending qualification",
    ADD_PENDING_WORK_EXPERIENCE: "Added pending work experience",
    INTERVIEW_SCHEDULED: "Scheduled interview",
    EMAIL_SENT: "Sent email",
  };

  // If we have a mapping, return it; otherwise format the action string
  return texts[action] || formatActionString(action);
}

// Helper function to format action strings that don't have explicit mappings
function formatActionString(action) {
  // Convert from SNAKE_CASE to Title Case with spaces
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to get specific file action text based on the field name
function getFileActionText(action, fieldName) {
  // Check if it's a qualification file
  if (fieldName?.startsWith("qualification.")) {
    return `${action} qualification file`;
  }
  // Check if it's a personal file
  else if (fieldName === "photoName" || fieldName === "photoUrl") {
    return `${action} photo file`;
  } else if (fieldName === "identificationNoUrl") {
    return `${action} identification file`;
  } else if (
    fieldName === "immigration_name" ||
    fieldName === "immigration_url"
  ) {
    return `${action} immigration file`;
  }
  // Default
  return `${action} file`;
}

// Helper function to format field names from snake_case to Title Case
function formatFieldName(fieldName) {
  try {
    // Handle null/undefined cases
    if (!fieldName) return "";
    
    // Convert to string if it's not already
    const fieldNameStr = String(fieldName);

    // Special case mappings for common field names and nested fields
    const specialCases = {
      // Personal details
      first_name: "First Name",
      last_name: "Last Name",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number",
      dob: "Date of Birth",
      dateOfBirth: "Date of Birth",
      placeOfBirth: "Place of Birth",
      countryOfBirth: "Country of Birth",
      identificationNo: "Identification Number",
      nationality: "Nationality",
      mobileNo: "Mobile Number",
      homeTelephoneNo: "Home Telephone",
      emergency_contact_name: "Emergency Contact Name",
      emergency_contact_no: "Emergency Contact Number",
      tuitionFees: "Tuition Fees",
      isEnglishFirstLanguage: "English First Language",
      entryDateToUK: "UK Entry Date",
      immigration_status: "Immigration Status",
      share_code: "Share Code",

      // Address fields
      address_line1: "Address Line 1",
      address_line2: "Address Line 2",
      addressLine1: "Address Line 1",
      addressLine2: "Address Line 2",
      city: "City",
      state: "State/County",
      postal_code: "Postal Code",
      postcode: "Postcode",
      country: "Country",

      // Application fields
      notes: "Notes",
      status: "Application Status",
      interview: "Interview",
      "interview.file": "Interview File",
      "interview.question": "Interview Question",

      // Nested fields
      "qualification.degree": "Degree",
      "qualification.institution": "Institution",
      "qualification.grade": "Grade",
      "qualification.year": "Year of Completion",
      "address.line1": "Address Line 1",
      "address.line2": "Address Line 2",
      "address.city": "City",
      "address.state": "State/County",
      "address.postal_code": "Postal Code",
      "address.country": "Country",
      "contact.email": "Email Address",
      "contact.phone": "Phone Number",
    };

    // Check for direct match in special cases (case insensitive)
    const lowerFieldName = fieldNameStr.toLowerCase();
    if (specialCases[lowerFieldName]) {
      return specialCases[lowerFieldName];
    }

    // Check if it's a nested field (contains a dot)
    if (fieldNameStr.includes(".")) {
      const parts = fieldNameStr.split(".");
      
      // Handle empty parts array
      if (!parts || parts.length === 0) {
        return formatSingleWord(fieldNameStr);
      }
      
      // Get the last part for formatting
      const lastPart = parts[parts.length - 1];
      
      // Handle specific field types
      
      // For qualification fields, just return the formatted last part
      if (parts[0] === "qualification" || 
          parts[0] === "pendingQualification" || 
          parts[0] === "workExperience") {
        return formatSingleWord(lastPart);
      }
      
      // For interview questions
      if (parts[0] === "interview") {
        if (parts[1] === "question") {
          // If we have a specific question name
          if (parts.length > 2 && parts[2]) {
            // Format the question name
            const formattedName = formatSingleWord(parts[2]);
            
            // Truncate long question names (limit to 40 characters)
            return formattedName.length > 40
              ? `${formattedName.substring(0, 40)}...`
              : formattedName;
          }
          return "Interview Question";
        }
        if (parts[1] === "file") {
          return "Interview File";
        }
        if (parts[1] === "status") {
          return "Interview Status";
        }
        if (parts[1] === "date") {
          return "Interview Date";
        }
        if (parts[1] === "details") {
          return "Interview Details";
        }
        return "Interview";
      }
      
      // For other nested fields, format as "Field (Context)"
      const context = parts
        .slice(0, -1)
        .map(part => formatSingleWord(part))
        .join(" ");
      
      const formattedField = formatSingleWord(lastPart);
      return `${formattedField}${context ? ` (${context})` : ""}`;
    }
    
    // For non-nested fields, just format the word
    return formatSingleWord(fieldNameStr);
  } catch (error) {
    console.error("Error in formatFieldName:", error);
    return String(fieldName || "");
  }
}

// Helper to format a single word, snake_case, or camelCase string
function formatSingleWord(text) {
  if (!text) return "";

  // If the text already has spaces and looks properly formatted, return it as is
  if (/^[A-Z].*\s.*/.test(text)) {
    return text;
  }

  // Handle camelCase by inserting spaces before capital letters
  const spacedText = text.replace(/([A-Z])/g, " $1");

  // Then handle any snake_case by replacing underscores with spaces
  return spacedText
    .toLowerCase()
    .split(/[_\s]+/) // Split by both underscores and spaces
    .filter((word) => word.length > 0) // Remove empty strings
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper to format values for display based on their type or field name
function formatValue(value, fieldName, shouldTruncate = true, maxLength = 100) {
  if (value === null || value === undefined) return "None";

  // Special handling for interview question objects
  if (
    typeof value === "object" &&
    value !== null &&
    value.question &&
    fieldName &&
    fieldName.includes("interview.question")
  ) {
    // Format the question from snake_case to Title Case
    const formattedQuestion = value.question
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return `Question: ${formattedQuestion}\nAnswer: ${value.answer || "None"}`;
  }

  // Format based on field name or value pattern
  if (fieldName) {
    const lowerFieldName = fieldName.toLowerCase();

    // Boolean values
    if (typeof value === "boolean" || value === "true" || value === "false") {
      return value === true || value === "true" ? "Yes" : "No";
    }

    // Currency formatting for fees
    if (
      lowerFieldName.includes("fee") ||
      lowerFieldName.includes("cost") ||
      lowerFieldName.includes("price")
    ) {
      return formatCurrency(value);
    }

    // Date formatting for date fields
    if (
      lowerFieldName.includes("date") ||
      lowerFieldName.includes("dob") ||
      lowerFieldName.includes("awarded")
    ) {
      if (value && typeof value === "string") {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }
        } catch (error) {
          // If date parsing fails, return the original value
        }
      }
    }
  }

  // Check if the value is an ISO date string
  if (
    typeof value === "string" &&
    value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  ) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return value;
    }
  }

  // Format boolean values
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle hasFile specially
  if (fieldName === "hasFile") {
    return value ? "Yes" : "No";
  }

  // Truncate long text values if truncation is enabled
  if (shouldTruncate && typeof value === "string" && value.length > maxLength) {
    return value.substring(0, maxLength) + "...";
  }

  return value;
}

// Format phone numbers with proper spacing
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";

  // Remove any non-digit characters
  const digitsOnly = phoneNumber.toString().replace(/\D/g, "");

  // UK phone number formatting
  if (digitsOnly.startsWith("44") || digitsOnly.startsWith("0")) {
    // Handle UK numbers
    if (digitsOnly.startsWith("44")) {
      // International format: +44 7911 123456
      return `+${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 6)} ${digitsOnly.substring(6)}`;
    } else if (digitsOnly.startsWith("0")) {
      // National format: 07911 123456
      return `${digitsOnly.substring(0, 5)} ${digitsOnly.substring(5)}`;
    }
  }

  // Generic formatting for other numbers
  if (digitsOnly.length > 6) {
    return `${digitsOnly.substring(0, digitsOnly.length - 6)} ${digitsOnly.substring(digitsOnly.length - 6)}`;
  }

  return phoneNumber;
}

// Format currency values
function formatCurrency(value) {
  if (!value) return "";

  // Try to convert to number if it's a string
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Check if it's a valid number
  if (!isNaN(numValue)) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(numValue);
  }

  return value;
}

function getRelativeTimeString(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
}

export function TimelineComponent({
  data,
  showPagination = true,
  truncateText = true,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use provided items or fallback to mock data
  const dataItems = data;

  if (!dataItems) return null;

  // Process activity log data to extract details from JSON
  const processedItems = dataItems.map((item) => {
    // Parse the details JSON string if it exists
    let parsedDetails = {};
    if (item.details && typeof item.details === "string") {
      try {
        parsedDetails = JSON.parse(item.details);
      } catch (error) {
        console.error("Error parsing details JSON:", error);
      }
    } else if (item.details && typeof item.details === "object") {
      parsedDetails = item.details;
    }

    // Parse prevValue and newValue if they are JSON strings
    let prevValue = parsedDetails?.prevValue || null;
    let newValue = parsedDetails?.newValue || null;

    // If prevValue is a string that looks like a JSON object, try to parse it
    if (
      typeof prevValue === "string" &&
      prevValue.startsWith("{") &&
      prevValue.endsWith("}")
    ) {
      try {
        prevValue = JSON.parse(prevValue);
      } catch (error) {
        console.error("Error parsing prevValue JSON:", error);
      }
    }

    // If newValue is a string that looks like a JSON object, try to parse it
    if (
      typeof newValue === "string" &&
      newValue.startsWith("{") &&
      newValue.endsWith("}")
    ) {
      try {
        newValue = JSON.parse(newValue);
      } catch (error) {
        console.error("Error parsing newValue JSON:", error);
      }
    }

    // Return a new object with the parsed details
    return {
      ...item,
      id: item.id,
      user:
        item.user?.firstName && item.user?.lastName
          ? `${item.user.firstName} ${item.user.lastName}`
          : "System",
      field: parsedDetails?.field || null,
      prevValue: prevValue,
      newValue: newValue,
      date: item.createdAt || item.date || new Date(),
    };
  });

  // Sort logs by date in descending order (newest first)
  const sortedItems = [...processedItems].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  // Calculate total pages
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };

  return (
    <div className="space-y-3">
      <Timeline>
        {dataItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Clock className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              No audit history yet.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Changes to this application will appear here.
            </p>
          </div>
        ) : (
          currentItems.map((item) => {
            const ActionIcon = getActionIcon(item.action);
            return (
              <TimelineItem
                key={item.id}
                step={item.id}
                className="flex-row items-center gap-3 px-4 py-2"
              >
                <div className="p-2 rounded-full bg-gray/80 flex items-center justify-center">
                  <ActionIcon size={16} />
                </div>
                {/* <img src={item.image} alt={item.user} className="size-6 rounded-full" /> */}
                <TimelineContent className="flex justify-between items-center w-full text-foreground">
                  <div className="flex-1 pr-4">
                    <p className="font-medium">
                      {item.user}{" "}
                      <span className="font-normal block">
                        {item.action === "ADD_FILE"
                          ? getFileActionText("Added", item.field)
                          : item.action === "DELETE_FILE"
                            ? getFileActionText("Deleted", item.field)
                            : getActionText(item.action)}
                        {item.field && (
                          <span className="block items-center mt-1">
                            <span className="bg-slate-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                              {formatFieldName(item.field)}
                            </span>
                          </span>
                        )}
                      </span>
                    </p>

                    {/* Display for structured data like qualifications and work experiences */}
                    {item.prevValue !== null && item.newValue !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        {/* Check if the values are objects (structured data) */}
                        {typeof item.prevValue === "object" &&
                        item.prevValue !== null &&
                        typeof item.newValue === "object" &&
                        item.newValue !== null ? (
                          <div className="border-l-2 border-gray-200 pl-2 mt-1">
                            {/* Display structured data in a more readable format */}
                            {Object.keys(item.newValue).map((key) => {
                              // Skip internal fields or empty values
                              if (
                                key === "id" ||
                                item.newValue[key] === null ||
                                item.newValue[key] === undefined
                              )
                                return null;

                              // Check if the field changed
                              const hasChanged =
                                !item.prevValue[key] !== !item.newValue[key] || // One exists and the other doesn't
                                item.prevValue[key] !== item.newValue[key]; // Values are different

                              if (!hasChanged) return null;

                              return (
                                <div key={key} className="mb-1 last:mb-0">
                                  <span className="font-medium">
                                    {formatFieldName(key)}:{" "}
                                  </span>
                                  {item.prevValue[key] ? (
                                    <span>
                                      <span className="line-through">
                                        {formatValue(
                                          item.prevValue[key],
                                          key,
                                          truncateText
                                        )}
                                      </span>
                                      {" → "}
                                      <span className="text-emerald-600">
                                        {formatValue(
                                          item.newValue[key],
                                          key,
                                          truncateText
                                        )}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600">
                                      {formatValue(
                                        item.newValue[key],
                                        key,
                                        truncateText
                                      )}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Simple change display for non-structured data */
                          <p>
                            Changed from &quot;
                            {formatValue(
                              item.prevValue,
                              item.field,
                              truncateText
                            )}
                            &quot; to &quot;
                            {formatValue(
                              item.newValue,
                              item.field,
                              truncateText
                            )}
                            &quot;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Display for added items (prevValue is null) */}
                    {item.prevValue === null && item.newValue !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        {/* Special handling for ADD_FILE action */}
                        {item.action === "ADD_FILE" ? (
                          <p>
                            Added:{" "}
                            {formatValue(
                              item.newValue,
                              item.field,
                              truncateText
                            )}
                          </p>
                        ) : /* For ADD_QUALIFICATION and ADD_WORK_EXPERIENCE, don't show detailed fields */
                        item.action === "ADD_QUALIFICATION" ||
                          item.action === "ADD_PENDING_QUALIFICATION" ||
                          item.action === "ADD_WORK_EXPERIENCE" ? (
                          <p></p>
                        ) : typeof item.newValue === "object" &&
                          item.newValue !== null ? (
                          <div className="border-l-2 border-gray-200 pl-2 mt-1">
                            {Object.keys(item.newValue).map((key) => {
                              // Skip internal fields or empty values
                              if (
                                key === "id" ||
                                item.newValue[key] === null ||
                                item.newValue[key] === undefined
                              )
                                return null;

                              return (
                                <div key={key} className="mb-1 last:mb-0">
                                  <span className="font-medium">
                                    {formatFieldName(key)}:{" "}
                                  </span>
                                  <span className="text-emerald-600">
                                    {formatValue(
                                      item.newValue[key],
                                      key,
                                      truncateText
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p>
                            {formatValue(
                              item.newValue,
                              item.field,
                              truncateText
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Display for deleted items (newValue is null) */}
                    {item.newValue === null && item.prevValue !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        {typeof item.prevValue === "object" &&
                        item.prevValue !== null ? (
                          <div className="border-l-2 border-gray-200 pl-2 mt-1">
                            {Object.keys(item.prevValue).map((key) => {
                              // Skip internal fields or empty values
                              if (
                                key === "id" ||
                                item.prevValue[key] === null ||
                                item.prevValue[key] === undefined
                              )
                                return null;

                              return (
                                <div key={key} className="mb-1 last:mb-0">
                                  <span className="font-medium">
                                    {formatFieldName(key)}:{" "}
                                  </span>
                                  <span className="line-through">
                                    {formatValue(item.prevValue[key], key)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p>
                            Removed:{" "}
                            {formatValue(
                              item.prevValue,
                              item.field,
                              truncateText
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Keep the improved date/time display */}
                  <div className="flex flex-col gap-y-0.5 items-end text-xs text-gray-500 whitespace-nowrap">
                    <span className="font-medium">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span>
                      {new Date(item.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      {getRelativeTimeString(new Date(item.date))}
                    </span>
                  </div>
                </TimelineContent>
              </TimelineItem>
            );
          })
        )}

        {/* Pagination controls */}
        {sortedItems.length > 0 && showPagination && (
          <div className="p-4 flex flex-col items-center justify-center gap-2">
            {/* Items per page and total count */}
            <div className="flex items-center justify-between w-full text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>per page</span>
              </div>
              <div>
                Showing {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, sortedItems.length)} of{" "}
                {sortedItems.length} items
              </div>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page number indicators */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show first page, last page, current page, and pages around current
                    let pageToShow;

                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all page numbers
                      pageToShow = i + 1;
                    } else if (currentPage <= 3) {
                      // If near start, show first 5 pages
                      pageToShow = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If near end, show last 5 pages
                      pageToShow = totalPages - 4 + i;
                    } else {
                      // Otherwise show current page and 2 pages on each side
                      pageToShow = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageToShow}
                        variant={
                          currentPage === pageToShow ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => goToPage(pageToShow)}
                        className="h-8 w-8 p-0"
                      >
                        {pageToShow}
                      </Button>
                    );
                  })}

                  {/* Add ellipsis if needed */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="mx-1">...</span>
                  )}

                  {/* Always show last page if not already shown */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      className="h-8 w-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Timeline>
    </div>
  );
}

// Default export for backward compatibility
export default TimelineComponent;
