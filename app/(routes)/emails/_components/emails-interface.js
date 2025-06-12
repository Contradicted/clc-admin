"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  CheckCircle,
  GraduationCap,
  Mail,
  FileText,
  ArrowDownSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const BATCH_SIZE = 50;
const STUDENTS_PER_PAGE = 10;

const LettersInterface = ({
  students,
  courses,
  courseInstances,
}) => {
  // State for filters - initialized as empty to require selection
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedInstance, setSelectedInstance] = useState("");
  const [selectedEnrollmentStatus, setSelectedEnrollmentStatus] =
    useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // State for email preference
  const [emailPreference, setEmailPreference] = useState("auto"); // 'auto', 'student', or 'personal'
  const [emailOverrides, setEmailOverrides] = useState({}); // Store student-specific email overrides

  // State for letter content
  const [letterContent, setLetterContent] = useState("");
  const [letterSubject, setLetterSubject] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const { toast: notify } = useToast();
  const router = useRouter();

  // Get filtered course instances based on selected course
  // Ensure courseInstances is properly handled
  const flattenedInstances = courseInstances || [];
      
  const filteredInstances = !selectedCourse
    ? [] // Empty array if no course selected
    : selectedCourse === "all"
      ? flattenedInstances // All instances if "all" selected
      : flattenedInstances.filter(
          (instance) => instance.course_id === selectedCourse
        );

  // Filter and sort students based on selected criteria
  const filteredStudents = students
    // First filter out any students without a first name or last name
    .filter(student => student.firstName && student.lastName)
    .filter((student) => {
      // First check if we have a search query - if so, prioritize search over filters
      const searchMatch = searchQuery
        ? `${student.firstName} ${student.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;
      
      // If searching by name and we have a match, show the student regardless of filters
      if (searchQuery && searchMatch) {
        return true;
      }
      
      // If no filters are selected, show all students
      const hasNoFilters = 
        (!selectedCourse || selectedCourse === "all") && 
        (!selectedCampus || selectedCampus === "all") && 
        (!selectedInstance || selectedInstance === "all") && 
        (!selectedEnrollmentStatus || selectedEnrollmentStatus === "all");
      
      if (hasNoFilters) {
        return searchMatch; // If no filters, just use search match (or show all if no search)
      }
      
      // Make sure student has applications array
      if (!student.applications || !Array.isArray(student.applications) || student.applications.length === 0) {
        return false;
      }
      
      // For 'all' selections, we need to handle them differently
      const isAllCourses = !selectedCourse || selectedCourse === "all";
      const isAllCampuses = !selectedCampus || selectedCampus === "all";
      const isAllInstances = !selectedInstance || selectedInstance === "all";
      
      // Find matching applications based on filters
      const matchingApplications = student.applications.filter(app => {
        const courseMatches = isAllCourses || app.courseID === selectedCourse;
        const campusMatches = isAllCampuses || app.campus === selectedCampus;
        
        // For instance matching, we need to compare with the instance_name
        let instanceMatches = isAllInstances;
        if (!isAllInstances && selectedInstance) {
          // Find the instance object by ID
          const selectedInstanceObj = flattenedInstances.find(inst => inst.id === selectedInstance);
          instanceMatches = app.commencement === selectedInstanceObj?.instance_name;
        }
        
        return courseMatches && campusMatches && instanceMatches;
      });
      
      // If we have at least one matching application, include this student
      const hasMatch = matchingApplications.length > 0;
      
      // Also check enrollment status
      const enrollmentMatch =
        !selectedEnrollmentStatus || 
        selectedEnrollmentStatus === "all" ||
        (selectedEnrollmentStatus === "enrolled" && student.enrolledStudent) ||
        (selectedEnrollmentStatus === "not-enrolled" && !student.enrolledStudent);
      
      // Return true only if all filters match
      return hasMatch && enrollmentMatch && searchMatch;
    })
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * STUDENTS_PER_PAGE,
    currentPage * STUDENTS_PER_PAGE
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCourse,
    selectedCampus,
    selectedInstance,
    selectedEnrollmentStatus,
    searchQuery,
  ]);

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      // Select all filtered students
      setSelectedStudents(filteredStudents.map((student) => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Handle individual student selection
  const handleStudentSelect = (checked, studentId) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    }
  };

  // Handle course selection change
  const handleCourseChange = (value) => {
    setSelectedCourse(value);
    setSelectedInstance(""); // Reset instance selection when course changes
  };

  // Handle sending letters
  const handleSendLetters = () => {
    // Check if we're using search-only mode (no filters but has search query)
    const isSearchOnlyMode = searchQuery && 
      (!selectedCourse || selectedCourse === "all") && 
      (!selectedCampus || selectedCampus === "all") && 
      (!selectedInstance || selectedInstance === "all") && 
      (!selectedEnrollmentStatus || selectedEnrollmentStatus === "all");
    
    // Only validate filters if we're not in search-only mode
    if (!isSearchOnlyMode) {
      // Validate all required selections are made
      if (!selectedCourse) {
        notify({
          title: "Course not selected",
          description: "Please select a course or use name search to find specific students.",
          variant: "destructive",
        });
        return;
      }
      
      if (!selectedCampus) {
        notify({
          title: "Campus not selected",
          description: "Please select a campus or use name search to find specific students.",
          variant: "destructive",
        });
        return;
      }
      
      if (!selectedInstance) {
        notify({
          title: "Commencement not selected",
          description: "Please select a commencement date or use name search to find specific students.",
          variant: "destructive",
        });
        return;
      }
      
      // Enrollment status is now optional - no validation needed
    }

    if (selectedStudents.length === 0) {
      notify({
        title: "No recipients selected",
        description: "Please select at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    if (!letterSubject.trim()) {
      notify({
        title: "Missing subject",
        description: "Please enter a subject for your email.",
        variant: "destructive",
      });
      return;
    }

    if (!letterContent.trim()) {
      notify({
        title: "Missing content",
        description: "Please enter content for your email.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirm(true);
  };

  // Handle confirmed send
  const handleConfirmedSend = async () => {
    try {
      setIsLoading(true);
      setShowConfirm(false);

      // Calculate total for progress
      const total = selectedStudents.length;
      setProgress({ current: 0, total });

      // Prepare student data for the API
      const selectedStudentsData = selectedStudents.map(studentId => {
        const student = students.find(s => s.id === studentId);
        
        // Check if this student has an email override
        const studentOverride = emailOverrides[student.id];
        const hasOffice365Email = !!student.enrolledStudent?.office365Email;
        const hasPersonalEmail = !!student.email;
        
        // First check for override, then fall back to global preference
        let effectivePreference = studentOverride || emailPreference;
        
        // Make sure the preferred email type is available
        if (effectivePreference === "student" && !hasOffice365Email) {
          effectivePreference = "personal";
        } else if (effectivePreference === "personal" && !hasPersonalEmail) {
          effectivePreference = "student";
        }
        
        // Determine if we should send to both email addresses when available
        // If we're using a specific preference (student or personal), only send to that one
        // If we're in auto mode, send to both addresses if available
        const sendToBothEmails = !studentOverride && emailPreference === "auto";
        
        // If we're sending to both emails, don't set a specific target email
        // The backend will handle collecting all available emails
        if (sendToBothEmails) {
          return {
            ...student,
            // Don't override the email field
            sendToBothEmails: true
          };
        } 
        // Otherwise, select a specific email based on preference
        else {
          let targetEmail;
          
          if (effectivePreference === "student") {
            // Use student email
            targetEmail = student.enrolledStudent.office365Email;
          } else if (effectivePreference === "personal") {
            // Use personal email
            targetEmail = student.email;
          } else {
            // Auto mode but with override - prioritize student email if enrolled
            targetEmail = student.enrolledStudent
              ? student.enrolledStudent.office365Email
              : student.email;
          }
          
          return {
            ...student,
            email: targetEmail,
            sendToBothEmails: false
          };
        }
      });
      
      try {
        // Send emails using our new API endpoint
        const response = await fetch("/api/emails/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            students: selectedStudentsData,
            subject: letterSubject,
            content: letterContent
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send emails");
        }
        
        const result = await response.json();
        
        // Update progress to complete
        setProgress({ current: total, total });
        
        // Show results
        if (result.results.sent > 0) {
          notify({
            title: "Emails sent successfully",
            description: `Successfully sent ${result.results.sent} email${
              result.results.sent !== 1 ? "s" : ""
            }${result.results.failed > 0 ? `, ${result.results.failed} failed` : ""}`,
            variant: result.results.failed > 0 ? "warning" : "success",
          });
          
          // Reset form after successful send
          setSelectedStudents([]);
          setSelectAll(false);

          router.refresh();
        } else {
          notify({
            title: "Failed to send emails",
            description: "No emails were sent successfully. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error sending emails:", error);
        notify({
          title: "Error sending emails",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error sending emails:", error);
      notify({
        title: "Error sending emails",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    // Reset all filters
    setSelectedCourse("");
    setSelectedCampus("");
    setSelectedInstance("");
    setSelectedEnrollmentStatus("");
    setEmailPreference("auto");
    setSearchQuery("");
    
    // Also reset student selection
    setSelectedStudents([]);
    setSelectAll(false);
    
    // Reset any email overrides
    setEmailOverrides({});
  };
  
  // Handle clearing email content
  const handleClearContent = () => {
    setLetterSubject("");
    setLetterContent("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Send Emails
          </h2>
          <p className="text-muted-foreground">
            Send official emails to students
          </p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select value={selectedCourse} onValueChange={handleCourseChange}>
            <SelectTrigger className={!selectedCourse ? "text-muted-foreground" : ""}>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={selectedCampus}
            onValueChange={(value) => setSelectedCampus(value)}
          >
            <SelectTrigger className={!selectedCampus ? "text-muted-foreground" : ""}>
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campuses</SelectItem>
              <SelectItem value="Bristol">Bristol</SelectItem>
              <SelectItem value="Birmingham">Birmingham</SelectItem>
              <SelectItem value="London">London</SelectItem>
              <SelectItem value="Sheffield">Sheffield</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={selectedInstance}
            onValueChange={(value) => setSelectedInstance(value)}
          >
            <SelectTrigger className={!selectedInstance ? "text-muted-foreground" : ""}>
              <SelectValue placeholder="Select commencement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commencements</SelectItem>
              {filteredInstances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.instance_name || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={selectedEnrollmentStatus}
            onValueChange={(value) => setSelectedEnrollmentStatus(value)}
          >
            <SelectTrigger className={!selectedEnrollmentStatus ? "text-muted-foreground" : ""}>
              <SelectValue placeholder="Select enrollment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="enrolled">Enrolled Students</SelectItem>
              <SelectItem value="not-enrolled">
                Non-Enrolled Students
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/3">
          <Select
            value={emailPreference}
            onValueChange={(value) => setEmailPreference(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Email preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Auto (Student Email if Enrolled)</span>
                </div>
              </SelectItem>
              <SelectItem value="student">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  <span>Student Email Only</span>
                </div>
              </SelectItem>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <span>Personal Email Only</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end md:w-1/3">
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Recipients</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectAll ||
                          (filteredStudents.length > 0 &&
                            selectedStudents.length === filteredStudents.length)
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) =>
                              handleStudentSelect(checked, student.id)
                            }
                            aria-label={`Select ${student.firstName} ${student.lastName}`}
                          />
                        </TableCell>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Check if this student has both email types
                            const hasStudentEmail =
                              !!student.enrolledStudent?.office365Email;
                            const hasPersonalEmail = !!student.email;
                            const hasBothEmails =
                              hasStudentEmail && hasPersonalEmail;

                            // Get the override for this student, if any
                            const studentOverride = emailOverrides[student.id];

                            // Determine which email to display based on preference and overrides
                            let emailType = studentOverride || emailPreference;
                            if (emailType === "student" && !hasStudentEmail)
                              emailType = "personal";
                            if (emailType === "personal" && !hasPersonalEmail)
                              emailType = "student";

                            // Render the email with appropriate icon
                            const isStudent =
                              emailType === "auto"
                                ? hasStudentEmail
                                : emailType === "student";
                            const emailToShow = isStudent
                              ? student.enrolledStudent?.office365Email
                              : student.email;
                            const icon = isStudent ? (
                              <GraduationCap className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Mail className="h-4 w-4 text-green-500" />
                            );

                            return (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  {icon}
                                  <span
                                    className="truncate text-right w-full"
                                    title={
                                      isStudent
                                        ? "Student email"
                                        : "Personal email"
                                    }
                                  >
                                    {emailToShow}
                                  </span>
                                </div>

                                {/* Only show toggle if student has both email types */}
                                {hasBothEmails && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      // Toggle between student and personal email
                                      const currentType =
                                        studentOverride ||
                                        (emailPreference === "auto"
                                          ? hasStudentEmail
                                            ? "student"
                                            : "personal"
                                          : emailPreference);

                                      const newType =
                                        currentType === "student"
                                          ? "personal"
                                          : "student";
                                      setEmailOverrides((prev) => ({
                                        ...prev,
                                        [student.id]: newType,
                                      }));
                                    }}
                                    title="Toggle email type"
                                  >
                                    <ArrowDownSquare className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No students found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="letterSubject">Subject</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearContent}
                className="text-xs"
              >
                Clear Content
              </Button>
            </div>
            <Input
              id="letterSubject"
              placeholder="Email subject"
              value={letterSubject}
              onChange={(e) => setLetterSubject(e.target.value)}
            />

            <div>
              <Label htmlFor="letterContent">Content</Label>
              <Textarea
                id="letterContent"
                placeholder="Email content..."
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                className="min-h-[200px] max-h-[400px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span>
            {selectedStudents.length} recipient
            {selectedStudents.length !== 1 ? "s" : ""} selected{" "} 
            <span className="text-slate-500">
              (of {filteredStudents.length} total)
            </span>
            {emailPreference !== "auto" && (
              <span className="ml-2">
                {emailPreference === "student" ? (
                  <span className="inline-flex items-center">
                    <GraduationCap className="h-4 w-4 text-blue-500 mr-1" />
                    Student emails only
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <Mail className="h-4 w-4 text-green-500 mr-1" />
                    Personal emails only
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
        <Button
          onClick={handleSendLetters}
          disabled={
            isLoading ||
            selectedStudents.length === 0 ||
            !letterContent.trim() ||
            !letterSubject.trim()
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Email
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Send Emails</DialogTitle>
            <DialogDescription>
              You are about to send this email to {selectedStudents.length}{" "}
              recipient
              {selectedStudents.length !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 mt-4 space-y-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Subject:</div>
            <div className="text-sm">{letterSubject}</div>
            <div className="text-sm font-medium mt-2">Content:</div>
            <div className="text-sm whitespace-pre-wrap">{letterContent}</div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="text-sm font-medium">Recipients:</div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {selectedStudents.map((studentId) => {
                  const student = students.find((s) => s.id === studentId);
                  return (
                    <div
                      key={studentId}
                      className="w-full text-sm flex justify-between items-center"
                    >
                      <span className="w-fit mr-2">
                        {student?.firstName} {student?.lastName}
                      </span>
                      <span className="text-muted-foreground flex items-center justify-end gap-1 flex-1">
                        {(() => {
                          // Check if this student has both email types
                          const hasStudentEmail =
                            !!student?.enrolledStudent?.office365Email;
                          const hasPersonalEmail = !!student?.email;
                          const hasBothEmails =
                            hasStudentEmail && hasPersonalEmail;

                          // Get the override for this student, if any
                          const studentOverride = emailOverrides[studentId];

                          // Determine which email to display based on preference and overrides
                          let emailType = studentOverride || emailPreference;
                          if (emailType === "student" && !hasStudentEmail)
                            emailType = "personal";
                          if (emailType === "personal" && !hasPersonalEmail)
                            emailType = "student";

                          // Render the email with appropriate icon
                          const isStudent =
                            emailType === "auto"
                              ? hasStudentEmail
                              : emailType === "student";
                          const emailToShow = isStudent
                            ? student?.enrolledStudent?.office365Email
                            : student?.email;

                          return (
                            <div className="flex items-center gap-1 justify-end w-full">
                              {isStudent ? (
                                <GraduationCap className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Mail className="h-3 w-3 text-green-500 flex-shrink-0" />
                              )}
                              <span className="truncate">{emailToShow}</span>
                              {studentOverride && (
                                <span className="ml-1 text-xs italic flex-shrink-0">
                                  (overridden)
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmedSend}>
              Send {selectedStudents.length} Email
              {selectedStudents.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <Progress value={(progress.current / progress.total) * 100} />
      )}
    </div>
  );
};

export default LettersInterface;
