"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { downloadFiles } from "@/lib/download";
import { useToast } from "@/components/ui/use-toast";

const ExportFiles = ({ data, courses }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  // Check if form is valid
  const isValid = useMemo(() => {
    return courseTitle && campus && commencement;
  }, [courseTitle, campus, commencement]);

  const handleDownload = async () => {
    if (!isValid) {
      toast({
        title: "Invalid selection",
        description: "Please select all fields before downloading",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const filtered = data.filter((app) => {
        return (
          app.courseTitle === courseTitle &&
          app.campus === campus &&
          app.commencement === commencement
        );
      });

      if (filtered.length === 0) {
        toast({
          title: "No applications found",
          description: "No applications match your selected criteria",
          variant: "destructive",
        });
        return;
      }

      toast({
        variant: "success",
        title: "Starting download",
        description: `Preparing files for ${filtered.length} application${filtered.length === 1 ? "" : "s"}...`,
      });

      await downloadFiles(filtered);
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "Failed to download files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">Export Files</h2>
        <p className="text-blue-100 mt-2">Download application files in bulk</p>
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
              {commencements.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {isValid && (
            <p className="text-sm text-muted-foreground">
              {
                data.filter(
                  (app) =>
                    app.courseTitle === courseTitle &&
                    app.campus === campus &&
                    app.commencement === commencement
                ).length
              }{" "}
              applications match your criteria
            </p>
          )}

          <Button
            onClick={handleDownload}
            disabled={isLoading || !isValid}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Files
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportFiles;
