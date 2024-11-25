"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const ExportFiles = ({ data, courses }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Check if form is valid and get matching applications count
  const { isValid, matchingCount } = useMemo(() => {
    const valid = courseTitle && campus && commencement;
    const count = valid
      ? data.filter(
          (app) =>
            app.courseTitle === courseTitle &&
            app.campus === campus &&
            app.commencement === commencement
        ).length
      : 0;
    return { isValid: valid, matchingCount: count };
  }, [courseTitle, campus, commencement, data]);

  // Reset form function
  const resetForm = () => {
    setCourseTitle("");
    setCampus("");
    setCommencement("");
  };

  const handleDownload = async () => {    
    if (!isValid) {
      toast({
        title: "Invalid selection",
        description: "Please select all fields before downloading",
        variant: "destructive",
      });
      return;
    }

    if (matchingCount === 0) {
      toast({
        title: "No applications found",
        description: "No applications match your selected criteria",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloading(true);
      
      toast({
        title: "Preparing download",
        description: `Gathering files for ${matchingCount} application${matchingCount === 1 ? '' : 's'}...`,
        variant: "success",
      });

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseTitle,
          campus,
          commencement,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `applications_${new Date().toISOString().split('T')[0]}.zip`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast({
        variant: "success",
        title: "Download started",
        description: "Your files will be saved to your downloads folder",
      });

      // Reset form after successful download
      resetForm();
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download files",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportStudentData = async () => {
    if (!isValid) {
      toast({
        title: "Invalid selection",
        description: "Please select all fields before exporting",
        variant: "destructive",
      });
      return;
    }

    if (matchingCount === 0) {
      toast({
        title: "No applications found",
        description: "No applications match your selected criteria",
        variant: "destructive",
      });
      return;
    }

    let link = null;
    try {
      setIsExporting(true);
      
      // Build URL with query parameters
      const params = new URLSearchParams({
        courseTitle,
        campus,
        commencement,
      });
      
      const response = await fetch(`/api/export-student-data?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `student_data_${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();

      toast({
        variant: "success",
        title: "Export successful",
        description: "Student data has been exported to CSV",
      });

      // Reset form after successful export
      resetForm();
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export student data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      // Clean up
      if (link && document.body.contains(link)) {
        document.body.removeChild(link);
      }
      // Release the URL object
      if (link?.href) {
        window.URL.revokeObjectURL(link.href);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">Application Files</h2>
        <p className="text-blue-100 mt-2">Download or export application data</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
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

        <div className="flex gap-4 items-center">
          <Button
            type="submit"
            onClick={handleDownload}
            disabled={isDownloading || isExporting || !isValid}
            className="bg-blue-500 hover:bg-blue-600 text-white w-fit"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Application Files{isValid && matchingCount > 0 ? ` (${matchingCount})` : ''}
              </>
            )}
          </Button>

          <Button
            type="submit"
            onClick={handleExportStudentData}
            disabled={isDownloading || isExporting || !isValid}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50 w-fit"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Export as Spreadsheet{isValid && matchingCount > 0 ? ` (${matchingCount})` : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportFiles;
