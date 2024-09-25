import { Input } from "@/components/ui/input";
import DataTableFacetedFilter from "@/components/data-table/data-table-faceted-filter";
import { Statuses } from "@/constants";
import { Button } from "@/components/ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { DownloadIcon } from "lucide-react";
import { exportTableToCSV } from "@/lib/export";
import { DateRangePicker } from "../date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DataTableToolbar = ({ table, courses, onReset, type }) => {
  const isFiltered = table.getState().columnFilters.length > 0;

  if (!courses) return null;

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
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportTableToCSV(table, {
              filename: type === "applications" ? "applications" : type,
              excludeColumns: ["select", "actions"],
            })
          }
        >
          <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default DataTableToolbar;
