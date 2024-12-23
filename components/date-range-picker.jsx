"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateRangePicker({
  table,
  date,
  setDate,
  placeholder = "Pick a date",
  triggerVariant = "outline",
  triggerSize = "default",
  triggerClassName,
  className,
  disabled,
  allowFutureDates = false,
  ...props
}) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  // Only update table filter if table is provided
  React.useEffect(() => {
    if (!table || !date?.from || !date?.to) return;
    
    table.getColumn("createdAt")?.setFilterValue([date.from, date.to]);
  }, [date?.from, date?.to, table]);

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={triggerVariant}
            size={triggerSize}
            disabled={disabled}
            className={cn(
              "w-full justify-start truncate text-left font-normal",
              !date && "text-muted-foreground",
              triggerClassName
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0", className)} {...props}>
          <Calendar
            initialFocus
            captionLayout="dropdown-buttons"
            fromYear={1920}
            toYear={allowFutureDates ? now.getFullYear() + 10 : now.getFullYear()}
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            weekStartsOn={1}
            numberOfMonths={2}
            disabled={(date) => {
              if (allowFutureDates) return false;
              return date > now;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
