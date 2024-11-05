"use client";

import { addYears, format, formatDate, subYears } from "date-fns";
import { useEffect, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MonthYearPicker({ value, onChange, yearsRange = 10 }) {
  const [date, setDate] = useState(value || null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearsRange }, (_, i) =>
    (currentYear - Math.floor(yearsRange / 2) + i).toString()
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    setDate(value || null);
  }, [value]);

  const handleYearChange = (year) => {
    const newDate = new Date(parseInt(year), date ? date.getMonth() : 0);
    setDate(newDate);
    onChange?.(newDate);
  };

  const handleMonthChange = (month) => {
    const newDate = new Date(
      date ? date.getFullYear() : new Date().getFullYear(),
      month
    );
    setDate(newDate);
    onChange?.(newDate);
  };

  const handlePrevYear = () => {
    if (date) {
      const newDate = subYears(date, 1);
      setDate(newDate);
      onChange?.(newDate);
    }
  };

  const handleNextYear = () => {
    if (date) {
      const newDate = addYears(date, 1);
      setDate(newDate);
      onChange?.(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM yyyy") : <span>Pick a Date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex items-center justify-between p-2">
          <Button variant="outline" size="icon" onClick={handlePrevYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            onValueChange={handleYearChange}
            value={date ? date.getFullYear().toString() : undefined}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2">
          {months.map((month, index) => (
            <Button
              key={month}
              onClick={() => handleMonthChange(index)}
              variant={
                date && date.getMonth() === index ? "default" : "outline"
              }
              className="text-sm"
            >
              {month.slice(0, 3)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
