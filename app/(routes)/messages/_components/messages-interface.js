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
import { toast } from "sonner";
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
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MAX_SMS_LENGTH = 160;
const BATCH_SIZE = 50;
const STUDENTS_PER_PAGE = 10;

export default function MessagesInterface({
  students,
  courses,
  courseInstances,
}) {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedInstance, setSelectedInstance] = useState("all");
  const [messageText, setMessageText] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast: notify } = useToast();

  // Calculate message stats
  const messageLength = messageText.length;
  const messageCount = Math.ceil(messageLength / MAX_SMS_LENGTH);
  const totalCredits = messageCount * selectedStudents.length;
  const isOverLimit = messageLength > MAX_SMS_LENGTH;

  // Get filtered course instances based on selected course
  const filteredInstances =
    selectedCourse === "all"
      ? courseInstances
      : courseInstances.filter(
          (instance) => instance.courseId === selectedCourse
        );

  // Filter and sort students based on selected criteria
  const filteredStudents = students
    .filter((student) => {
      const courseMatch =
        selectedCourse === "all" ||
        student.application?.course?.id === selectedCourse;
      const campusMatch =
        selectedCampus === "all" ||
        student.application?.campus === selectedCampus;
      const instanceMatch =
        selectedInstance === "all" ||
        student.application?.commencement ===
          courseInstances.find((instance) => instance.id === selectedInstance)
            ?.name;
      const searchMatch = searchQuery
        ? `${student.application?.user?.firstName} ${student.application?.user?.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;
      return courseMatch && campusMatch && instanceMatch && searchMatch;
    })
    .sort((a, b) => {
      const nameA =
        `${a.application?.user?.firstName} ${a.application?.user?.lastName}`.toLowerCase();
      const nameB =
        `${b.application?.user?.firstName} ${b.application?.user?.lastName}`.toLowerCase();
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
  }, [selectedCourse, selectedCampus, selectedInstance, searchQuery]);

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      // Select all filtered students
      const newSelectedIds = filteredStudents.map((student) => student.id);
      setSelectedStudents(newSelectedIds);
    } else {
      setSelectedStudents([]);
    }
  };

  // Calculate selection stats
  const selectedInView = paginatedStudents.filter((student) =>
    selectedStudents.includes(student.id)
  ).length;

  const selectedTotal = selectedStudents.length;
  const filteredTotal = filteredStudents.length;

  // Check if all filtered students are selected
  useEffect(() => {
    const allFilteredSelected = filteredStudents.every((student) =>
      selectedStudents.includes(student.id)
    );
    setSelectAll(allFilteredSelected && filteredStudents.length > 0);
  }, [selectedStudents, filteredStudents]);

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
    setSelectedInstance("all"); // Reset instance selection when course changes
  };

  // Handle sending messages
  const handleSendMessages = async () => {
    if (!messageText.trim()) {
      notify({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (selectedStudents.length === 0) {
      notify({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmedSend = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    setProgress({ current: 0, total: selectedStudents.length });

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          message: messageText.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send messages");
      }

      // Show success toast with details
      notify({
        title: "Messages Sent",
        description: `Successfully sent ${result.sent} message${
          result.sent === 1 ? "" : "s"
        }${result.failed ? ` (${result.failed} failed)` : ""}`,
        variant: result.failed ? "destructive" : "success",
      });

      // Clear selection and message
      setMessageText("");
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (error) {
      notify({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedCourse("all");
    setSelectedCampus("all");
    setSelectedInstance("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Send SMS Messages
        </h2>
        <p className="text-sm text-muted-foreground">
          Filter students and send SMS messages to selected recipients.
        </p>
      </div>

      {selectedTotal > 0 && (
        <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {selectedTotal} student{selectedTotal !== 1 ? "s" : ""} selected
            </span>
            {selectedTotal !== filteredTotal && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSelectAll(true)}
              >
                Select all {filteredTotal} filtered students
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStudents([])}
          >
            Clear selection
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Select value={selectedCourse} onValueChange={handleCourseChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Course" />
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

        <Select value={selectedCampus} onValueChange={setSelectedCampus}>
          <SelectTrigger>
            <SelectValue placeholder="Select Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            <SelectItem value="London">London</SelectItem>
            <SelectItem value="Bristol">Bristol</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedInstance} onValueChange={setSelectedInstance}>
          <SelectTrigger>
            <SelectValue placeholder="Select Instance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Instances</SelectItem>
            {filteredInstances.map((instance) => (
              <SelectItem key={instance.id} value={instance.id}>
                {instance.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleResetFilters}
          className="text-sm"
        >
          Reset Filters
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 w-full">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              Showing {paginatedStudents.length} of {filteredStudents.length}{" "}
              students
            </p>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Instance</TableHead>
                <TableHead>Campus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className={
                    selectedStudents.includes(student.id) ? "bg-muted/50" : ""
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) =>
                        handleStudentSelect(checked, student.id)
                      }
                      aria-label={`Select ${student.application?.user?.firstName}`}
                    />
                  </TableCell>
                  <TableCell>
                    {student.application?.user?.firstName}{" "}
                    {student.application?.user?.lastName}
                  </TableCell>
                  <TableCell>{student.application?.course?.name}</TableCell>
                  <TableCell>{student.application?.commencement}</TableCell>
                  <TableCell>{student.application?.campus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className={cn(
              "min-h-[100px]",
              isOverLimit && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <div className="flex items-center justify-between text-sm">
            <div className="space-x-4">
              <span
                className={cn(
                  "text-muted-foreground",
                  isOverLimit && "text-destructive"
                )}
              >
                {messageLength} / {MAX_SMS_LENGTH} characters
              </span>
              {messageCount > 1 && (
                <span className="text-yellow-600">
                  Will send as {messageCount} messages per student
                </span>
              )}
            </div>
            <div className="text-muted-foreground">
              Total credits required: {totalCredits}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>
              {selectedStudents.length} recipient
              {selectedStudents.length !== 1 ? "s" : ""}
            </span>
            {messageCount > 1 && (
              <>
                <span>•</span>
                <span className="text-yellow-600">
                  {messageCount} SMS per recipient
                </span>
              </>
            )}
            {totalCredits > 0 && (
              <>
                <span>•</span>
                <span>
                  {totalCredits} credit{totalCredits !== 1 ? "s" : ""} required
                </span>
              </>
            )}
          </div>
          <Button
            onClick={handleSendMessages}
            disabled={
              isLoading || selectedStudents.length === 0 || !messageText.trim()
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Messages
          </Button>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Send Messages</DialogTitle>
            <DialogDescription>
              You are about to send this message to {selectedStudents.length}{" "}
              recipient
              {selectedStudents.length !== 1 ? "s" : ""}.
              {messageCount > 1 && (
                <div className="mt-2 text-yellow-600">
                  This will be sent as {messageCount} separate SMS messages per
                  recipient.
                </div>
              )}
              {totalCredits > 0 && (
                <div className="mt-2">
                  This will use {totalCredits} credit
                  {totalCredits !== 1 ? "s" : ""}.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 mt-4 space-y-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Message Preview:</div>
            <div className="text-sm whitespace-pre-wrap">{messageText}</div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="text-sm font-medium">Recipients:</div>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {selectedStudents.map((studentId) => {
                const student = students.find((s) => s.id === studentId);
                return (
                  <div
                    key={studentId}
                    className="text-sm flex justify-between items-center"
                  >
                    <span>
                      {student?.application?.user?.firstName}{" "}
                      {student?.application?.user?.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {student?.application?.mobileNo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmedSend}>
              Send {selectedStudents.length} Message
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
}
