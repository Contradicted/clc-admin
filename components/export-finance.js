"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/date-range-picker";
import { format } from "date-fns";
import { Calendar, CircleDollarSign, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const monthNames = [
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

const formatDateTime = (date) => {
  const formattedDate = format(new Date(date), 'dd/MM/yyyy');
  return { dateShort: formattedDate };
};

const ExportFinance = ({ data, courses }) => {
  const [courseTitle, setCourseTitle] = useState("");
  const [campus, setCampus] = useState("");
  const [commencement, setCommencement] = useState("");
  const [slcStatus, setSlcStatus] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [exporting, setExporting] = useState(false);
  const [exportMode, setExportMode] = useState("filtered");
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

  // Count payments in selected date range
  const paymentsInDateRange = useMemo(() => {
    if (!dateRange?.from) return 0;
    return data.reduce((count, app) => {
      if (!app.paymentPlan?.expectedPayments) return count;
      const payments = Array.isArray(app.paymentPlan.expectedPayments) 
        ? app.paymentPlan.expectedPayments 
        : [];
      return count + payments.filter(payment => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        const from = new Date(dateRange.from);
        const to = dateRange.to ? new Date(dateRange.to) : from;
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return paymentDate >= from && paymentDate <= to;
      }).length;
    }, 0);
  }, [data, dateRange]);

  // Check if form is valid and get count
  const { isValid, count } = useMemo(() => {
    if (exportMode === "date-range") {
      return {
        isValid: dateRange.from !== null && paymentsInDateRange > 0,
        count: paymentsInDateRange
      };
    }

    const valid = courseTitle && campus && commencement;
    if (!valid) return { isValid: false, count: 0 };
    
    const hasValidDateFilter = (month && (!dateRange.from && !dateRange.to)) || 
                             (!month && dateRange.from);
    
    return {
      isValid: valid && (!hasValidDateFilter || 
                        (month ? paymentsInMonth > 0 : paymentsInDateRange > 0)),
      count: filteredApplications.length,
    };
  }, [exportMode, courseTitle, campus, commencement, filteredApplications.length, month, 
      paymentsInMonth, dateRange, paymentsInDateRange]);

  // Check if date filtering should be disabled
  const disableDateFilter = useMemo(() => {
    return slcStatus === 'In-process' || slcStatus === 'Rejected';
  }, [slcStatus]);

  // Reset date range when month/year is selected and vice versa
  useEffect(() => {
    if (month || year) {
      setDateRange({ from: null, to: null });
    }
  }, [month, year]);

  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      setMonth("");
      setYear("");
    }
  }, [dateRange]);

  // Reset all date filters when status changes to in-process or rejected
  useEffect(() => {
    if (disableDateFilter) {
      setMonth("");
      setYear("");
      setDateRange({ from: null, to: null });
    }
  }, [disableDateFilter]);

  const handleDateChange = (newDate) => {
    setDateRange(newDate || { from: null, to: null });
  };

  const handleExport = async () => {
    if (!isValid) {
      toast({
        title: "Invalid Selection",
        description: exportMode === "date-range" 
          ? "Please select a date range with available payments"
          : "Please select valid filters before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setExporting(true);

      let filename = "student-finance";
      
      // Add date range to filename if using date picker
      if (dateRange.from) {
        const fromDate = formatDateTime(dateRange.from).dateShort;
        const toDate = dateRange.to ? formatDateTime(dateRange.to).dateShort : fromDate;
        filename += `-${fromDate}${dateRange.to ? `-to-${toDate}` : ""}`;
      } else if (month && year) {
        // Add month and year if using those filters
        filename += `-${monthNames[month - 1]}-${year}`;
      }

      // Add SLC status to filename if selected
      if (slcStatus) {
        filename += `-${slcStatus.toLowerCase().replace(/ /g, "-")}`;
      }

      filename += ".csv";

      const filters = {
        courseTitle: courseTitle || undefined,
        campus: campus || undefined,
        commencement: commencement || undefined,
        slcStatus: slcStatus || undefined,
        month: month || undefined,
        year: year || undefined,
        dateRange: dateRange.from ? {
          from: dateRange.from,
          to: dateRange.to || dateRange.from
        } : undefined,
        exportMode
      };

      const response = await fetch("/api/export-student-finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      const csvContent = await response.text();
      
      if (!csvContent) {
        toast({
          title: "No Data",
          description: "No records found matching your criteria.",
          variant: "destructive",
        });
        return;
      }

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        variant: "success",
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
        <h2 className="text-2xl font-bold">Student Finance Export</h2>
        <p className="text-green-100 mt-2">Export SLC application data</p>
      </div>

      <div className="p-6">
        <div className="flex space-x-6 mb-6">
          <button
            onClick={() => setExportMode("filtered")}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
              exportMode === "filtered"
                ? "bg-green-50 text-green-700 font-medium shadow-sm ring-1 ring-green-100"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            <Filter className={`w-4 h-4 mr-2 transition-colors duration-200 ${
              exportMode === "filtered" ? "text-green-600" : "text-gray-400"
            }`} />
            Export with Filters
          </button>
          <button
            onClick={() => setExportMode("date-range")}
            className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
              exportMode === "date-range"
                ? "bg-green-50 text-green-700 font-medium shadow-sm ring-1 ring-green-100"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            <Calendar className={`w-4 h-4 mr-2 transition-colors duration-200 ${
              exportMode === "date-range" ? "text-green-600" : "text-gray-400"
            }`} />
            Export by Date Range
          </button>
        </div>

        <div className="space-y-6">
          {exportMode === "filtered" ? (
            <Card>
              <CardHeader>
                <CardTitle>Export with Filters</CardTitle>
                <CardDescription>
                  Export student finance data filtered by course, campus, and other criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                  <Select value={slcStatus} onValueChange={setSlcStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select SLC Status" />
                    </SelectTrigger>
                    <SelectContent position="top">
                      <SelectItem value="In-process">In-process</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Approved - Maintenance Loan">
                        Approved - Maintenance Loan
                      </SelectItem>
                      <SelectItem value="Approved - Tuition Fees">
                        Approved - Tuition Fees
                      </SelectItem>
                      <SelectItem value="Approved - Tuition Fees & Maintenance Loan">
                        Approved - Tuition Fees & Maintenance Loan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-4 grid-cols-2">
                    <Select 
                      value={month} 
                      onValueChange={setMonth}
                      disabled={disableDateFilter || dateRange.from !== null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent position="top">
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={year} 
                      onValueChange={setYear}
                      disabled={disableDateFilter || dateRange.from !== null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent position="top">
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Export by Date Range</CardTitle>
                <CardDescription>
                  Export all student finance payments within a specific date range across all courses
                </CardDescription>
              </CardHeader>
              <CardContent className="max-w-lg">
                <DateRangePicker
                  date={dateRange}
                  setDate={handleDateChange}
                  placeholder="Select Date Range"
                  triggerClassName="w-full"
                  allowFutureDates={true}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">
                {exportMode === "date-range" 
                  ? dateRange.from
                    ? `Found ${paymentsInDateRange} payments between ${format(new Date(dateRange.from), 'dd/MM/yyyy')}${dateRange.to ? ` and ${format(new Date(dateRange.to), 'dd/MM/yyyy')}` : ''}`
                    : "Please select a date range"
                  : courseTitle && campus && commencement
                    ? dateRange.from
                      ? `Found ${count} applications with ${paymentsInDateRange} payments between ${format(new Date(dateRange.from), 'dd/MM/yyyy')}${dateRange.to ? ` and ${format(new Date(dateRange.to), 'dd/MM/yyyy')}` : ''}`
                      : month
                        ? `Found ${count} applications with ${paymentsInMonth} payments in ${months[parseInt(month)].label} ${year || new Date().getFullYear()}`
                        : `Found ${count} applications`
                    : "Please select course, campus and commencement"}
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={!isValid || exporting}
              className="mt-4 w-fit bg-green-600 hover:bg-green-700"
            >
              {exporting ? (
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
    </div>
  );
};

export default ExportFinance;
