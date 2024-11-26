"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, BanknotePound, CircleDollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const ExportFiles = ({ data, courses }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [loading, setLoading] = useState({ type: null });
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

  // Check if form is valid and get counts
  const { isValid, counts } = useMemo(() => {
    const valid = courseTitle && campus && commencement;
    if (!valid) return { isValid: false, counts: { total: 0, slc: 0 } };
    
    const matches = data.filter(app => 
      app.courseTitle === courseTitle && 
      app.campus === campus && 
      app.commencement === commencement
    );
    
    return { 
      isValid: valid, 
      counts: {
        total: matches.length,
        slc: matches.filter(app => app.tuitionFees === 'Student Loan Company England (SLC)').length
      }
    };
  }, [courseTitle, campus, commencement, data]);

  const handleExport = async (type) => {
    if (!isValid) {
      toast({
        title: "Invalid selection",
        description: "Please select all fields before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (type === 'finance' && counts.slc === 0) {
      toast({
        title: "No SLC applications found",
        description: "No Student Finance England applications match your selected criteria",
        variant: "destructive",
      });
      return;
    }

    if (type !== 'finance' && counts.total === 0) {
      toast({
        title: "No applications found",
        description: "No applications match your selected criteria",
        variant: "destructive",
      });
      return;
    }

    let link = null;
    try {
      setLoading({ type });
      
      const endpoints = {
        download: '/api/download',
        student: '/api/export-student-data',
        finance: '/api/export-student-finance'
      };

      const method = type === 'download' ? 'POST' : 'GET';
      const params = new URLSearchParams({ courseTitle, campus, commencement });
      const url = type === 'download' ? endpoints[type] : `${endpoints[type]}?${params}`;
      
      const response = await fetch(url, {
        method,
        ...(type === 'download' && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseTitle, campus, commencement }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      link = document.createElement('a');
      link.style.display = 'none';
      link.href = downloadUrl;

      const date = new Date().toISOString().split('T')[0];
      const fileNames = {
        download: `applications_${date}.zip`,
        student: `student_data_${date}.csv`,
        finance: `student_finance_${date}.csv`
      };
      link.download = fileNames[type];
      
      document.body.appendChild(link);
      link.click();

      const messages = {
        download: "Files downloaded successfully",
        student: "Student data has been exported to CSV",
        finance: "Student finance data has been exported to CSV"
      };

      toast({
        variant: "success",
        title: "Export successful",
        description: messages[type],
      });

      setCourseTitle("");
      setCampus("");
      setCommencement("");
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading({ type: null });
      if (link?.parentNode === document.body) {
        document.body.removeChild(link);
      }
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

        <div className="flex gap-4 items-center flex-wrap">
          <Button
            type="submit"
            onClick={() => handleExport('download')}
            disabled={loading.type || !isValid}
            className="bg-blue-500 hover:bg-blue-600 text-white w-fit"
          >
            {loading.type === 'download' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Application Files{isValid && counts.total > 0 ? ` (${counts.total})` : ''}
              </>
            )}
          </Button>

          <Button
            type="submit"
            onClick={() => handleExport('student')}
            disabled={loading.type || !isValid}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50 w-fit"
          >
            {loading.type === 'student' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Export Student Details{isValid && counts.total > 0 ? ` (${counts.total})` : ''}
              </>
            )}
          </Button>

          <Button
            type="submit"
            onClick={() => handleExport('finance')}
            disabled={loading.type || !isValid}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50 w-fit"
          >
            {loading.type === 'finance' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <CircleDollarSign className="w-4 h-4 mr-2" />
                Export Finance Details{isValid && counts.slc > 0 ? ` (${counts.slc})` : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportFiles;
