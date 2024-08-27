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

const InterviewModal = ({ studentData, applicationData }) => {
  const [open, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showQuestions, setShowQuestions] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      date: applicationData?.interview?.[0]?.date || "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form]);

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
    startTransition(() => {
      interview(values, applicationData.id)
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
                      <p>Interview Date & Time</p>
                    </div>
                    <div className="w-full relative z-0">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <DateTimePicker
                                hourCycle={12}
                                yearRange={3}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {applicationData?.interview.length > 0 && (
                    <Button
                      type="button"
                      className="mt-4 w-full"
                      onClick={() => setShowQuestions(true)}
                    >
                      View Questions
                    </Button>
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
