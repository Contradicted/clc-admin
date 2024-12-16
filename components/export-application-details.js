"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const ExportApplicationDetails = ({ data, courses }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get commencements for selected course
  const commencements = useMemo(() => {
    if (!courseTitle) return [];
    const course = courses.find((c) => c.name === courseTitle);
    return course?.course_instances.map((i) => i.instance_name) || [];
  }, [courseTitle, courses]);

  // Reset commencement when course changes
  useEffect(() => {
    if (!commencements.includes(commencement)) {
      setCommencement("");
    }
  }, [courseTitle, commencements, commencement]);

  // Filter applications based on selected criteria
  const filteredApplications = useMemo(() => {
    return data.filter((app) => {
      if (courseTitle && app.courseTitle !== courseTitle) return false;
      if (campus && app.campus !== campus) return false;
      if (commencement && app.commencement !== commencement) return false;
      return true;
    });
  }, [data, courseTitle, campus, commencement]);

  // Check if form is valid and get count
  const { isValid, count } = useMemo(() => {
    const valid = courseTitle && campus && commencement;
    if (!valid) return { isValid: false, count: 0 };
    return { isValid: valid, count: filteredApplications.length };
  }, [courseTitle, campus, commencement, filteredApplications.length]);

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
        title: "No applications found",
        description: "No applications match your selected criteria",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ courseTitle, campus, commencement });
      const response = await fetch(`/api/export-application-data?${params}`, {
        method: "GET",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${campus}_${commencement.replace(/[^a-zA-Z0-9]/g, '_')}_details_${new Date().toISOString().split("T")[0]}.csv`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        variant: "success",
        title: "Export successful",
        description: "Application details have been exported to CSV",
      });

      setCourseTitle("");
      setCampus("");
      setCommencement("");
    } catch (error) {
      console.error("[EXPORT_APPLICATION_DETAILS_ERROR]", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export application details",
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
          <h2 className="text-2xl font-bold">Application Details Export</h2>
        </div>
        <p className="text-blue-100 mt-2">Export application details and information</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Select value={courseTitle} onValueChange={setCourseTitle}>
            <SelectTrigger>
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent position="top">
              {courses.map((course) => (
                <SelectItem key={course.name} value={course.name}>
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
        </div>

        <div className="flex justify-between items-center space-y-4">
          <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">
              {isValid ? (
                <p className="text-sm text-gray-600">
                  {count} application{count !== 1 ? "s" : ""} match your criteria
                </p>
              ) : (
                "Please select course, campus and commencement"
              )}
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={!isValid || loading}
            className="w-fit max-w-sm bg-blue-500 hover:bg-blue-600"
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

export default ExportApplicationDetails;
