"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Calendar } from "lucide-react";
import { compareAsc, format } from "date-fns";
import { DateRangePicker } from "@/components/date-range-picker";

const ExportInterviews = ({ interviews, courses }) => {
    const [courseTitle, setCourseTitle] = useState("");
    const [campus, setCampus] = useState("");
    const [commencement, setCommencement] = useState("");
    const [status, setStatus] = useState("");
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
  
    // Debug interview data
    // useEffect(() => {
    //   console.log(`Total interviews received: ${interviews.length}`);
    //   if (interviews.length > 0) {
    //     console.log("Sample interview data:", interviews[0]);
    //   }
    // }, [interviews]);
  
    // Debug date range changes
    // useEffect(() => {
    //   if (dateRange && dateRange.from) {
    //     console.log("Date range selected:", {
    //       from: dateRange.from.toISOString(),
    //       to: dateRange.to ? dateRange.to.toISOString() : "none",
    //     });
    //   } else {
    //     console.log("Date range cleared or not set");
    //   }
    // }, [dateRange]);
  
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
  
    // Reset commencement when course changes
    useEffect(() => {
      if (!commencements.includes(commencement)) {
        setCommencement("");
      }
    }, [courseTitle, commencements, commencement]);
  
    // Filter interviews based on selected criteria
    const filteredInterviews = useMemo(() => {
      return interviews.filter((interview) => {
        const application = interview.application;
        if (!application) return false;
        if (courseTitle && application.courseTitle !== courseTitle) return false;
        if (campus && application.campus !== campus) return false;
        if (commencement && application.commencement !== commencement)
          return false;
  
        // Only filter by status if a specific status is selected (not "all" and not empty)
        if (status && status !== "all") {
          // Handle null/undefined status in interviews
          if (interview.status === null || interview.status === undefined) {
            // If filtering for a specific status, exclude interviews with no status
            return false;
          }
  
          if (status === "pass" && interview.status !== "pass") return false;
          if (status === "fail" && interview.status !== "fail") return false;
        }
  
        // Filter by date range if specified
        if (dateRange && dateRange.from) {
          const interviewDate = new Date(interview.date);
          const from = new Date(dateRange.from);
          const to = dateRange.to ? new Date(dateRange.to) : new Date();
  
          // Set time to beginning/end of day for accurate comparison
          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);
  
          if (interviewDate < from || interviewDate > to) return false;
        }
  
        return true;
      });
    }, [interviews, courseTitle, campus, commencement, status, dateRange]);
  
    // Check if form is valid and get count
    const { isValid, count } = useMemo(() => {
      const valid = courseTitle && campus && commencement;
      if (!valid) return { isValid: false, count: 0 };
      return { isValid: valid, count: filteredInterviews.length };
    }, [courseTitle, campus, commencement, filteredInterviews.length]);
  
    // Handle export
    const handleExport = async () => {
      if (!isValid) {
        toast({
          title: "Invalid selection",
          description: "Please select all fields before proceeding",
          variant: "destructive",
        });
        return;
      }
  
      if (count === 0) {
        toast({
          title: "No interviews found",
          description: "No interviews match your selected criteria",
          variant: "destructive",
        });
        return;
      }
  
      setLoading(true);
  
      try {
        const filters = {
          courseTitle: courseTitle || undefined,
          campus: campus || undefined,
          commencement: commencement || undefined,
          status: status || undefined,
          dateRange:
            dateRange && dateRange.from
              ? {
                  from: dateRange.from.toISOString(),
                  to: dateRange.to
                    ? dateRange.to.toISOString()
                    : new Date().toISOString(),
                }
              : undefined,
        };
  
        console.log("Sending export request with filters:", filters);
        console.log(
          "Client-side filtered interviews count:",
          filteredInterviews.length
        );
  
        const response = await fetch("/api/export-interviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to export interviews");
        }
  
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interviews_${courseTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${campus}_${commencement.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
  
        toast({
          variant: "success",
          title: "Export successful",
          description: "Interviews have been exported successfully.",
        });
  
        setCourseTitle("");
        setCampus("");
        setCommencement("");
        setStatus("");
        setDateRange({ from: null, to: null });
      } catch (error) {
        console.error("Export error:", error);
        toast({
          title: "Export Failed",
          description:
            error.message || "An error occurred while exporting interviews.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Interview Export</h2>
          </div>
          <p className="text-blue-100 mt-2">
            Export interview data filtered by course, campus, commencement,
            status, and date range
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select value={courseTitle} onValueChange={setCourseTitle}>
              <SelectTrigger>
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent position="top">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.name}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
  
            <Select value={campus} onValueChange={setCampus}>
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
  
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent position="top">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
  
            <div className="lg:col-span-2">
              <DateRangePicker
                date={dateRange}
                setDate={setDateRange}
                placeholder="Filter by interview date range"
                allowFutureDates={false}
                triggerClassName="w-full"
              />
            </div>
          </div>
  
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {isValid ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">
                    {count} {count === 1 ? "interview" : "interviews"} match your
                    criteria
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    Please select course, campus and commencement
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={handleExport}
              disabled={!isValid || count === 0 || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  export default ExportInterviews;