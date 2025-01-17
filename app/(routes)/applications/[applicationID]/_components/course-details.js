"use client";

import { updateCourseDetails } from "@/actions/update-application";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate, formatStudyMode } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { compareAsc, format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PencilIcon } from "lucide-react";

const formatCommencement = (instanceName) => {
  if (instanceName === "On Demand") {
    return instanceName;
  }
  try {
    return format(new Date(instanceName), "MMMM yyyy");
  } catch {
    return instanceName;
  }
};

const formSchema = z.object({
  courseTitle: z.string().min(1, "Course title is required"),
  studyMode: z.enum(["full_time", "part_time"], {
    errorMap: () => ({ message: "Please select a study mode" }),
  }),
  campus: z.string().min(1, "Campus is required"),
  commencement: z.string().min(1, "Commencement is required"),
  ab_registration_no: z
    .string()
    .max(20, {
      message: "AB registration number cannot exceed 20 characters",
    })
    .optional(),
  ab_registration_date: z.date().optional(),
  awarding_body: z.string().optional(),
});

const CourseDetails = ({
  courseTitle,
  studyMode,
  commencement,
  campus,
  courses,
  applicationID,
  ab_registration_no,
  ab_registration_date,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const now = new Date();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      courseTitle: courseTitle || "",
      studyMode: studyMode || "",
      commencement: commencement || "",
      campus: campus || "",
      ab_registration_no: ab_registration_no || "",
      ab_registration_date: ab_registration_date || "",
      awarding_body:
        courses.find((c) => c.name === courseTitle)?.awarding_body || "",
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
      const availableCommencements = selectedCourse.course_instances.map(
        (instance) => instance.instance_name
      );
      const currentMode = form.getValues("studyMode");
      const currentCommencement = form.getValues("commencement");

      if (currentMode && !availableModes.includes(currentMode)) {
        form.setValue("studyMode", "");
      } else if (!currentMode && availableModes.length > 0) {
        // Set the first available mode if no mode is currently selected
        form.setValue("studyMode", availableModes[0]);
      }

      if (
        currentCommencement &&
        !availableCommencements.includes(currentCommencement)
      ) {
        form.setValue("commencement", "");
      } else if (!currentCommencement && availableCommencements.length > 0) {
        // Set the first available mode if no mode is currently selected
        form.setValue("commencement", availableCommencements[0]);
      }
    }
  }, [watchCourseTitle, courses, form]);

  return (
    <div className="mt-6 mb-4 rounded-lg border bg-white shadow">
      <div className="flex items-center justify-end border-b px-5 py-3">
        {!isEditing ? (
          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              form="course-details-form"
              type="submit"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="p-5">
        {!isEditing ? (
          <div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Course
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {courseTitle || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Study Mode
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {formatStudyMode(studyMode) || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Campus
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {campus || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Commencement
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {commencement
                      ? formatCommencement(commencement)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Awarding Body Details
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Awarding Body
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {courses.find((c) => c.name === courseTitle)
                        ?.awarding_body || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      AB Registration No.
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {ab_registration_no || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      AB Registration Date
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {ab_registration_date
                        ? format(new Date(ab_registration_date), "dd MMM yyyy")
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              id="course-details-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="courseTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selectedCourse = courses.find(
                              (c) => c.name === value
                            );
                            form.setValue(
                              "awarding_body",
                              selectedCourse?.awarding_body || ""
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.name}>
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studyMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Mode</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select study mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="campus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campus</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="London">London</SelectItem>
                            <SelectItem value="Birmingham">
                              Birmingham
                            </SelectItem>
                            <SelectItem value="Manchester">
                              Manchester
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commencement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commencement</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select commencement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On Demand">On Demand</SelectItem>
                            {courses
                              .find((c) => c.name === watchCourseTitle)
                              ?.course_instances.map((instance) => (
                                <SelectItem
                                  key={instance.id}
                                  value={instance.instance_name}
                                >
                                  {formatCommencement(instance.instance_name)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Awarding Body Details
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ab_registration_no"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AB Registration Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter registration number"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ab_registration_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AB Registration Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal rounded-md text-sm px-3",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isSaving}
                                >
                                  {field.value ? (
                                    formatDate(new Date(field.value))
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={new Date(field.value)}
                                  captionLayout="dropdown-buttons"
                                  fromYear={1920}
                                  toYear={now.getFullYear()}
                                  onSelect={(date) =>
                                    field.onChange(new Date(date))
                                  }
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                  weekStartsOn={1}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
