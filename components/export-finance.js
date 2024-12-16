"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, CircleDollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const months = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const ExportFinance = ({ data, courses }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [slcStatus, setSlcStatus] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get commencements for selected course
  const commencements = useMemo(() => {
    if (!courseTitle) return [];
    const course = courses.find((c) => c.name === courseTitle);
    return course?.course_instances.map((i) => i.instance_name) || [];
  }, [courseTitle, courses]);

  // Filter applications based on selected criteria
  const filteredApplications = useMemo(() => {
    return data.filter((app) => {
      if (courseTitle && app.courseTitle !== courseTitle) return false;
      if (campus && app.campus !== campus) return false;
      if (commencement && app.commencement !== commencement) return false;
      if (slcStatus && (!app.paymentPlan || app.paymentPlan.slcStatus !== slcStatus)) return false;
      return true;
    });
  }, [data, courseTitle, campus, commencement, slcStatus]);

  // Count payments in selected month and year
  const paymentsInMonth = useMemo(() => {
    if (!month) return 0;
    return filteredApplications.reduce((count, app) => {
      if (!app.paymentPlan?.expectedPayments) return count;
      const payments = Array.isArray(app.paymentPlan.expectedPayments) 
        ? app.paymentPlan.expectedPayments 
        : [];
      return count + payments.filter(payment => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === parseInt(month) && 
               (!year || paymentDate.getFullYear() === parseInt(year));
      }).length;
    }, 0);
  }, [filteredApplications, month, year]);

  // Check if form is valid and get count
  const { isValid, count } = useMemo(() => {
    const valid = courseTitle && campus && commencement;
    if (!valid) return { isValid: false, count: 0 };
    return {
      isValid: valid && (!month || paymentsInMonth > 0),
      count: filteredApplications.length,
    };
  }, [courseTitle, campus, commencement, filteredApplications.length, month, paymentsInMonth]);

  // Check if month/year filtering should be disabled
  const disableMonthYearFilter = useMemo(() => {
    return slcStatus === 'In-process' || slcStatus === 'Rejected';
  }, [slcStatus]);

  // Reset month and year when status changes to in-process or rejected
  useEffect(() => {
    if (disableMonthYearFilter) {
      setMonth("");
      setYear("");
    }
  }, [disableMonthYearFilter]);

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
        title: "No SLC applications found",
        description: "No Student Finance England applications match your selected criteria",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({ 
        courseTitle, 
        campus, 
        commencement,
        ...(slcStatus && { slcStatus }),
        ...(month !== "" && { month }),
        ...(year !== "" && { year })
      });
      
      const response = await fetch(`/api/export-student-finance?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = downloadUrl;
      
      const date = new Date().toISOString().split('T')[0];
      link.download = `student_finance_${date}.csv`;
      
      document.body.appendChild(link);
      link.click();

      toast({
        variant: "success",
        title: "Export successful",
        description: "Student finance data has been exported to CSV",
      });

      setCourseTitle("");
      setCampus("");
      setCommencement("");
      setSlcStatus("");
      setMonth("");
      setYear("");
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
        <h2 className="text-2xl font-bold">Student Finance Export</h2>
        <p className="text-green-100 mt-2">Export SLC application data</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
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

          <Select value={slcStatus} onValueChange={setSlcStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select SLC Status" />
            </SelectTrigger>
            <SelectContent position="top">
              <SelectItem value="In-process">In-process</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Approved - Maintenance Loan">Approved - Maintenance Loan</SelectItem>
              <SelectItem value="Approved - Tuition Fees">Approved - Tuition Fees</SelectItem>
              <SelectItem value="Approved - Tuition Fees & Maintenance Loan">
                Approved - Tuition Fees & Maintenance Loan
              </SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={month} 
            onValueChange={setMonth}
            disabled={disableMonthYearFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Month" />
            </SelectTrigger>
            <SelectContent position="top">
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={year} 
            onValueChange={setYear}
            disabled={disableMonthYearFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Year" />
            </SelectTrigger>
            <SelectContent position="top">
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">
              {courseTitle && campus && commencement
                ? month
                  ? `Found ${count} applications with ${paymentsInMonth} payments in ${months[parseInt(month)].label} ${year || new Date().getFullYear()}`
                  : `Found ${count} applications`
                : "Please select course, campus and commencement"}
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={!isValid || loading}
            className="bg-green-600 hover:bg-green-700"
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

export default ExportFinance;
