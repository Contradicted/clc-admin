"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { toast, useToast } from "@/components/ui/use-toast";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { DateTimePicker } from "@/components/date-time-picker";
import { interview } from "@/actions/interview";
import { formatDateTime } from "@/lib/utils";
import InterviewQuestions from "./interview-questions";

import { isEmpty } from "lodash";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DateTimePickerForm from "@/components/DateTimePickerForm";

const InterviewModal = ({ studentData, applicationData }) => {
  const [open, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isStudentTest, setIsStudentTest] = useState(
    applicationData?.interview?.[0]?.student_test
  );
  const [showQuestions, setShowQuestions] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      date: applicationData?.interview?.[0]?.date || "",
      status: applicationData?.interview?.[0]?.status || "",
      student_test:
        applicationData?.interview?.[0]?.student_test === true
          ? "true"
          : "false" || undefined,
      test_status: applicationData?.interview?.[0]?.test_status || undefined,
      notes: applicationData?.interview?.[0]?.notes || undefined,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

  const handleOpenChange = (open) => {
    if (isPending) {
      return;
    }

    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = (values) => {
    const studentTestValue = form.getValues("student_test");

    if (studentTestValue === "false") {
      form.setValue("test_status", null);
    }

    const formValues = form.getValues();

    startTransition(() => {
      interview(formValues, applicationData.id)
        .then((data) => {
          if (data?.success) {
            setIsOpen(false);
            toast({
              variant: "success",
              title: data.success,
            });
            router.refresh();
          }

          if (data?.error) {
            toast({
              variant: "destructive",
              title: data.error,
            });
          }
        })
        .catch((error) => {
          setIsOpen(false);
          toast({
            variant: "destructive",
            title: error,
          });
        })
        .finally(() => {
          setIsOpen(false);
          router.refresh();
        });
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="default2">Interview</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Interview</DialogTitle>
            <div className="border-2 border-primary w-[25%] rounded-sm" />
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 mt-4">
                <div className="w-full space-y-4 pb-4">
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[35%]">
                      <p>Student ID</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {studentData.id}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[35%]">
                      <p>Student Name</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {studentData.firstName + " " + studentData.lastName}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[35%]">
                      <p>Course Title</p>
                    </div>
                    <p className="flex flex-wrap font-medium text-black w-full">
                      {applicationData.courseTitle}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[35%]">
                      <p>Date & Time</p>
                    </div>
                    <div className="w-full relative z-0">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                            <div className="[&_[data-radix-popper-content-wrapper]]:!top-auto [&_[data-radix-popper-content-wrapper]]:!bottom-[100%]">
                                <DateTimePickerForm
                                  selected={field.value}
                                  onSelect={(date, time) => {
                                    if (date && time) {
                                      const [hours, minutes] = time.split(':').map(Number);
                                      const newDate = new Date(date);
                                      newDate.setHours(hours);
                                      newDate.setMinutes(minutes);
                                      field.onChange(newDate);
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {applicationData?.interview.length > 0 && (
                    <>
                      <Button
                        type="button"
                        className="mt-4 w-full"
                        onClick={() => setShowQuestions(true)}
                      >
                        View Questions
                      </Button>
                      <div className="flex gap-3">
                        <div className="flex items-start w-full max-w-[35%]">
                          <p>Interview Status</p>
                        </div>
                        <div className="w-full relative z-0">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="z-[9999999]">
                                    <SelectItem value="pass">Pass</SelectItem>
                                    <SelectItem value="fail">Fail</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex items-start w-full max-w-[35%]">
                          <p>Student Test</p>
                        </div>
                        <div className="w-full relative z-0">
                          <FormField
                            control={form.control}
                            name="student_test"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value === "true") {
                                      setIsStudentTest(true);
                                    } else {
                                      setIsStudentTest(false);
                                    }
                                  }}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="z-[9999999]">
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      {isStudentTest && (
                        <div className="flex gap-3">
                          <div className="flex items-start w-full max-w-[35%]">
                            <p>Test Status</p>
                          </div>
                          <div className="w-full relative z-0">
                            <FormField
                              control={form.control}
                              name="test_status"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[9999999]">
                                      <SelectItem value="pass">Pass</SelectItem>
                                      <SelectItem value="fail">Fail</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <div className="flex items-start w-full max-w-[35%]">
                          <p>Comments</p>
                        </div>
                        <div className="w-full relative z-0">
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea className="resize-y" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <p>Save changes</p>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <InterviewQuestions
        open={showQuestions}
        onOpenChange={setShowQuestions}
        interviewID={applicationData.interview?.[0]?.id}
        questionData={applicationData.interview?.[0]?.questions}
        fileData={applicationData.interview?.[0]?.files}
      />
    </>
  );
};

export default InterviewModal;
