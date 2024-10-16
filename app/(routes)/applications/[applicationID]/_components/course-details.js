"use client";

import { updateCourseDetails } from "@/actions/update-application";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatStudyMode } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  courseTitle: z.string().min(1, "Course title is required"),
  studyMode: z.enum(["full_time", "part_time"], {
    errorMap: () => ({ message: "Please select a study mode" }),
  }),
  campus: z.string().min(1, "Campus is required"),
});

const CourseDetails = ({
  courseTitle,
  studyMode,
  campus,
  courses,
  applicationID,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      courseTitle: courseTitle || "",
      studyMode: studyMode || "",
      campus: campus || "",
    },
    resolver: zodResolver(formSchema),
  });

  const watchCourseTitle = form.watch("courseTitle");

  const onSubmit = (values) => {
    startTransition(() => {
      updateCourseDetails(values, applicationID).then((data) => {
        if (data?.success) {
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
      });
    });
  };

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  useEffect(() => {
    const selectedCourse = courses.find(
      (course) => course.name === form.getValues("courseTitle")
    );
    if (selectedCourse) {
      const availableModes = selectedCourse.course_study_mode.map(
        (mode) => mode.study_mode
      );
      const currentMode = form.getValues("studyMode");
      if (currentMode && !availableModes.includes(currentMode)) {
        form.setValue("studyMode", "");
      } else if (!currentMode && availableModes.length > 0) {
        // Set the first available mode if no mode is currently selected
        form.setValue("studyMode", availableModes[0]);
      }
    }
  }, [watchCourseTitle, courses, form]);

  return (
    <div className="border-b border-stroke space-y-4 mt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="w-full flex justify-end">
            {isEditing ? (
              <div className="flex items-center gap-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={toggleEdit}>Edit</Button>
            )}
          </div>
          <div className="w-full space-y-4 pb-4 mt-4">
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                <p>Course Title</p>
              </div>
              {isEditing ? (
                <FormField
                  name="courseTitle"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent position="top">
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.name}>
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {courseTitle}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Study Mode
              </div>
              {isEditing ? (
                <FormField
                  name="studyMode"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a study mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses
                              .find(
                                (course) =>
                                  course.name === form.watch("courseTitle")
                              )
                              ?.course_study_mode.map((mode) => (
                                <SelectItem
                                  key={mode.id}
                                  value={mode.study_mode}
                                >
                                  {formatStudyMode(mode.study_mode)}
                                </SelectItem>
                              )) || (
                              <SelectItem value="" disabled>
                                No study modes available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {formatStudyMode(studyMode)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">Campus</div>
              {isEditing ? (
                <FormField
                  name="campus"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campus" />
                          </SelectTrigger>
                          <SelectContent position="top">
                            <SelectItem value="London">London</SelectItem>
                            <SelectItem value="Bristol">Bristol</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {campus}
                </p>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseDetails;
