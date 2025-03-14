"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  const [monthOpen, setMonthOpen] = React.useState(false);
  const [yearOpen, setYearOpen] = React.useState(false);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        caption_dropdowns: "flex gap-x-3",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-white hover:bg-primary hover:text-white/80 focus:bg-primary focus:text-white/80",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Dropdown: ({ value, onChange, children, ...props }) => {
          const options = React.Children.toArray(children);
          const selected = options.find((child) => child.props.value === value);
          const handleChange = (value) => {
            const changeEvent = {
              target: { value },
            };
            onChange?.(changeEvent);
            // Close the current dropdown after selection
            if (props.name === "months") {
              setMonthOpen(false);
            } else if (props.name === "years") {
              setYearOpen(false);
            }
          };

          const handleOpenChange = (open) => {
            if (props.name === "months") {
              setMonthOpen(open);
              if (open) setYearOpen(false);
            } else if (props.name === "years") {
              setYearOpen(open);
              if (open) setMonthOpen(false);
            }
          };

          const handleClick = (e) => {
            // Prevent click from bubbling up to parent elements
            e.stopPropagation();
          };

          return (
            <div onClick={handleClick}>
              <Select
                value={value?.toString()}
                onValueChange={handleChange}
                open={props.name === "months" ? monthOpen : yearOpen}
                onOpenChange={handleOpenChange}
              >
                <SelectTrigger className="h-6 border-none rounded-none p-0 justify-start gap-x-2 w-fit ml-2.5">
                  <SelectValue>{selected?.props?.children}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" className="z-[99999999]">
                  <ScrollArea className="h-80">
                    {options.map((option, id) => (
                      <SelectItem
                        key={id}
                        value={option.props.value?.toString()}
                      >
                        {option.props.children}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          );
        },
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
