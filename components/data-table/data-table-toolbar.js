import { Input } from "@/components/ui/input";
import DataTableFacetedFilter from "@/components/data-table/data-table-faceted-filter";
import { Statuses } from "@/constants";
import { Button } from "@/components/ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ChevronDownIcon, DownloadIcon } from "lucide-react";
import { exportTableToCSV } from "@/lib/export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dayjs from "dayjs";
import { getDisplayStatus } from "@/lib/utils";

const DataTableToolbar = ({ table, courses, onReset, type, data }) => {
  const isFiltered = table.getState().columnFilters.length > 0;

  if (!courses) return null;

  // Helper function to get formatted column headers
  const getColumnHeader = (key) => {
    const headers = {
      // Interview headers
      studentName: "Student",
      date: "Interview Date",
      status: "Status",
      applicationID: "Application ID",

      // Application headers
      id: "Application ID",
      courseTitle: "Course",
      createdAt: "Submission Date",
      user: "Student", // Added this mapping

      // Student headers
      firstName: "First Name",
      lastName: "Last Name",
      createdAt: "Registered Date",
    };
    return headers[key] || key;
  };

  const handleExport = (all = false) => {
    // Get current page or all filtered data
    const dataToExport = all
      ? table.getFilteredRowModel().rows.map((row) => row.original)
      : table.getRowModel().rows.map((row) => row.original);

    // Format the data based on table type
    const formattedData = dataToExport.map((row) => {
      const formattedRow = { ...row };

      // Handle status formatting for interviews and applications
      if (type === "interviews") {
        formattedRow.status = row.status
          ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
          : "Pending";
      }

      // Format student name and status for applications
      if (type === "applications") {
        if (row.firstName && row.lastName) {
          formattedRow.user = `${row.firstName.trim()} ${row.lastName.trim()}`;
        }
        formattedRow.status = row.status ? getDisplayStatus(row.status) : "N/A";
      }

      // Trim string values for all tables
      Object.keys(formattedRow).forEach((key) => {
        if (typeof formattedRow[key] === "string") {
          formattedRow[key] = formattedRow[key].trim();
        }
      });

      return formattedRow;
    });

    // Get visible columns and handle empty columns
    const visibleColumns = table
      .getAllColumns()
      .filter(
        (col) =>
          col.getIsVisible() &&
          !["actions", "Action", "application", ""].includes(
            col.columnDef.id || col.columnDef.accessorKey
          ) // Check both id and accessorKey // Filter out empty column
      )
      .map((col) => ({
        ...col.columnDef,
        header: getColumnHeader(col.columnDef.accessorKey),
      }));

    // Build filename based on active filters and table type
    const timestamp = new Date().toISOString().split("T")[0];
    let prefix = type;

    if (type === "interviews") {
      // ... existing interview logic ...
    } else if (type === "applications") {
      const statusFilter = table.getColumn("status")?.getFilterValue()?.[0];
      const courseFilter = table.getColumn("courseTitle")?.getFilterValue();

      if (statusFilter) {
        prefix = `${statusFilter === null ? "Pending" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} applications`;
      }
      if (courseFilter) {
        prefix = `${prefix} for ${courseFilter}`;
      }
    } else if (type === "students") {
      // Add any specific student table filters if needed
      const nameFilter =
        table.getColumn("firstName")?.getFilterValue() ||
        table.getColumn("lastName")?.getFilterValue();
      if (nameFilter) {
        prefix = `students matching "${nameFilter}"`;
      }
    }

    const filename = `${prefix}_${all ? "all" : "page"}_${timestamp}`;

    exportTableToCSV(formattedData, visibleColumns, {
      filename,
      excludeColumns: ["select", "actions", "application"],
    });
  };

  return (
    <div className="flex items-center justify-between flex-grow">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by ID"
          value={table.getColumn("id")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("id")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {type === "students" && (
          <div className="flex space-x-2">
            <Input
              placeholder="Filter by first name"
              value={table.getColumn("firstName")?.getFilterValue() ?? ""}
              onChange={(event) => {
                table
                  .getColumn("firstName")
                  ?.setFilterValue(event.target.value);
              }}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <Input
              placeholder="Filter by last name"
              value={table.getColumn("lastName")?.getFilterValue() ?? ""}
              onChange={(event) => {
                table.getColumn("lastName")?.setFilterValue(event.target.value);
              }}
              className="h-8 w-[150px] lg:w-[250px]"
            />
          </div>
        )}
        {type === "applications" && (
          <Select
            value={table.getColumn("courseTitle")?.getFilterValue() ?? ""}
            onValueChange={(value) =>
              table.getColumn("courseTitle")?.setFilterValue(value)
            }
          >
            <SelectTrigger className="h-8 w-[150px] lg:w-[250px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent position="top">
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.name}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {type === "applications" && table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={Statuses}
          />
        )}
        {type === "interviews" && (
          <>
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Interview Status"
              options={[
                { label: "Pass", value: "pass" },
                { label: "Fail", value: "fail" },
                { label: "Pending", value: null },
              ]}
            />
          </>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              onReset();
              table.resetColumnFilters();
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 size-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 items-center text-right gap-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
              Export
              <ChevronDownIcon className="ml-2 size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px]">
            <DropdownMenuItem
              className="flex cursor-pointer items-center justify-between rounded-sm px-4 py-2.5 hover:bg-gray focus:bg-gray dark:hover:bg-graydark transition-all"
              onClick={() => handleExport(false)}
            >
              <div className="flex items-center gap-2">
                <DownloadIcon className="size-4 text-gray-500" />
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-medium">Export Page</span>
                  <span className="text-xs text-gray-500">
                    Export data from current page
                  </span>
                </div>
              </div>
              <span className="ml-auto text-xs font-medium text-gray-500">
                ({table.getRowModel().rows.length})
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex cursor-pointer items-center justify-between rounded-sm px-4 py-2.5 hover:bg-gray focus:bg-gray dark:hover:bg-graydark transition-all"
              onClick={() => handleExport(true)}
            >
              <div className="flex items-center gap-2">
                <DownloadIcon className="size-4 text-gray-500" />
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-medium">Export All</span>
                  <span className="text-xs text-gray-500">
                    Export all {isFiltered ? "filtered" : ""} data
                  </span>
                </div>
              </div>
              <span className="ml-auto text-xs font-medium text-gray-500">
                ({table.getFilteredRowModel().rows.length})
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DataTableToolbar;
