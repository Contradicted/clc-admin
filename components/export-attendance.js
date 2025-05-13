"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Download, Loader2, FileText, CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { compareAsc, format } from "date-fns";

const ExportAttendance = ({ courses }) => {
  // State for form values
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [hasStudents, setHasStudents] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  
  const { toast } = useToast();

  const handleExport = async () => {
    if (!courseTitle || !campus || !commencement) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        campus: campus,
        commencement: commencement,
        date: date.toISOString(),
        courseTitle: courseTitle,
      });

      const response = await fetch(`/api/export-attendance?${params}`, {
        method: "GET",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate attendance sheet");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `attendance_sheet_${format(date, "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        variant: "success",
        title: "Success",
        description: "Attendance sheet generated successfully",
      });
      
      // Reset fields after successful generation, keeping only the date
      setCourseTitle("");
      setCampus("");
      setCommencement("");
      setHasStudents(false);
      setErrorMessage("");
      
    } catch (error) {
      console.error("[EXPORT_ERROR]", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to generate attendance sheet",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get commencements for selected course
    const commencements = useMemo(() => {
      if (!courseTitle) return [];
      const course = courses.find((c) => c.name === courseTitle);
      return (
        course?.course_instances
          ?.map((i) => i.instance_name)
          .filter(Boolean)
          .sort((a, b) => {
            if (a === "On Demand") return -1;
            if (b === "On Demand") return 1;
            return compareAsc(new Date(a), new Date(b));
          }) || []      
      );
    }, [courseTitle, courses]);
  
    // Check if form is valid and get count
  const { isValid, count } = useMemo(() => {
    const valid = courseTitle && campus && commencement;
    if (!valid) return { isValid: false, count: 0 };
    
    // If all criteria are selected, fetch the count
    if (valid && !studentsLoading) {
      setStudentsLoading(true);
      
      // Fetch student count from API
      const params = new URLSearchParams({
        campus: campus,
        commencement: commencement,
        courseTitle: courseTitle,
        checkOnly: "true",
      });
      
      fetch(`/api/export-attendance/check?${params}`)
        .then(response => response.json())
        .then(data => {
          setStudentCount(data.count || 0);
          setStudentsLoading(false);
        })
        .catch(() => {
          setStudentCount(0);
          setStudentsLoading(false);
        });
    }
    
    return { isValid: valid, count: studentCount };
  }, [courseTitle, campus, commencement, studentCount]);
  
  // Reset commencement when course changes
  useEffect(() => {
      if (!commencements.includes(commencement)) {
        setCommencement("");
      }
    }, [courseTitle, commencements, commencement]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Attendance Sheets</h2>
        </div>
        <p className="text-blue-100 mt-2">
          Generate attendance sheets for courses and specific dates
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Course selection */}
          <Select value={courseTitle} onValueChange={setCourseTitle}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent position="top">
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.name}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={campus} onValueChange={setCampus} disabled={!courseTitle}>
            <SelectTrigger>
              <SelectValue placeholder="Select Campus" />
            </SelectTrigger>
            <SelectContent position="top">
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="Bristol">Bristol</SelectItem>
              <SelectItem value="Sheffield">Sheffield</SelectItem>
              <SelectItem value="Birmingham">Birmingham</SelectItem>
            </SelectContent>
          </Select>

          {/* Commencement selection */}
          <Select
            value={commencement}
            onValueChange={setCommencement}
            disabled={!courseTitle}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Commencement" />
            </SelectTrigger>
            <SelectContent position="top">
              {commencements.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "PPP") : "Select date"}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Show error message if no students are found */}
        {errorMessage && courseTitle && campus && commencement && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {errorMessage}
          </div>
        )}
        
        {/* Show loading indicator while checking for students */}
        {studentsLoading && courseTitle && campus && commencement && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-md flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking student availability...
          </div>
        )}

        <div className="flex justify-between items-center space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">
              {isValid ? (
                <p className="text-sm text-gray-600">
                  {count} student{count !== 1 ? "s" : ""} match your criteria
                </p>
              ) : (
                "Please select course, campus and commencement"
              )}
            </p>
          </div>

          <Button
            onClick={handleExport}
            className="w-fit max-w-sm bg-blue-500 hover:bg-blue-600"
            disabled={!isValid || loading || count === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Attendance Sheet
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportAttendance;
