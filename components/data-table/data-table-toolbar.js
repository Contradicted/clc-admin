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

const DataTableToolbar = ({ table, courses, onReset }) => {
  const isFiltered = table.getState().columnFilters.length > 0;

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
        <Select
          value={table.getColumn("courseTitle")?.getFilterValue() ?? ""}
          onValueChange={(value) =>
            table.getColumn("courseTitle")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="h-8 w-[150px] lg:w-[250px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.name}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {table.getColumn("status") && (
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
              filename: "applications",
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
