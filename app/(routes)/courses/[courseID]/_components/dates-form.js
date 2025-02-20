"use client";

import { courses } from "@/actions/courses";
import { DateTimePicker } from "@/components/date-time-picker";
import MonthYearPicker from "@/components/month-year-picker";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  calculateWeeksBetweenDates,
  checkIsActive,
  cn,
  formatDate,
} from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { addWeeks, compareAsc, format, parse } from "date-fns";
import { Loader2, PencilIcon, PlusIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  course_instances: z
    .array(
      z
        .object({
          instance_name: z.union([
            z.date(),
            z.string().min(1, { message: "Commencement is required" }),
          ]),
          isOnDemand: z.boolean().default(false),
          status: z.boolean(),
          availability: z.coerce.number().min(0).max(999).default(0),
          start_date: z
            .date({ invalid_type_error: "Start date is required" })
            .optional()
            .nullable(),
          last_join_weeks: z.string().optional().nullable(),
          last_join_date: z
            .date({
              invalid_type_error: "Last join date is required",
            })
            .optional()
            .nullable(),
          end_date: z
            .date({ invalid_type_error: "End date is required" })
            .optional()
            .nullable(),
          results_weeks: z.string().optional().nullable(),
          results_date: z
            .date({ invalid_type_error: "Results date is required" })
            .optional()
            .nullable(),
        })
        .refine(
          (data) => {
            if (data.isOnDemand) {
              return true; // Skip date validations for on-demand courses
            }
            // Original date validation logic for non-on-demand courses
            return (
              data.start_date && 
              data.last_join_date && 
              data.end_date && 
              data.results_date &&
              data.last_join_weeks &&
              data.results_weeks
            );
          },
          {
            message: "All dates and week fields are required for scheduled courses",
          }
        )
        .refine(
          (data) => {
            if (data.start_date && data.end_date) {
              return data.end_date > data.start_date;
            }
            return true;
          },
          {
            message: "End date must be after the start date",
            path: ["end_date"],
          }
        )
        .refine(
          (data) => {
            if (data.last_join_date && data.end_date) {
              return data.end_date > data.last_join_date;
            }
            return true;
          },
          {
            message: "End date must be after the last join date",
            path: ["end_date"],
          }
        )
        .refine(
          (data) => {
            if (data.start_date && data.results_date) {
              return data.results_date > data.start_date;
            }
            return true;
          },
          {
            message: "Results date must be after the start date",
            path: ["results_date"],
          }
        )
        .refine(
          (data) => {
            if (data.last_join_date && data.results_date) {
              return data.results_date > data.last_join_date;
            }
            return true;
          },
          {
            message: "Results date must be after the last join date",
            path: ["results_date"],
          }
        )
        .refine(
          (data) => {
            if (data.end_date && data.results_date) {
              return data.results_date >= data.end_date;
            }
            return true;
          },
          {
            message: "Results date must be on or after the end date",
            path: ["results_date"],
          }
        )
    )
    .min(1, "At least one commencement is required"),
});

const DatesTable = ({ courseDates }) => {
  // Filter and sort regular dates, excluding On Demand
  const sortedDates = [...courseDates]
    .filter(date => date.instance_name !== "On Demand")
    .sort((a, b) => compareAsc(new Date(a.instance_name), new Date(b.instance_name)));

  // Find On Demand instance if it exists
  const onDemandInstance = courseDates.find(date => date.instance_name === "On Demand");

  return (
    <table className="w-full">
      <tbody>
        {/* Render On Demand instance first if it exists */}
        {onDemandInstance && [
          ...[
            {
              label: "Course Type",
              value: "On Demand",
            },
            {
              label: "Enrollment",
              value: "Open for enrollment anytime",
            },
            {
              label: "Duration",
              value: "Flexible completion",
            },
            {
              label: "Status",
              value: onDemandInstance.status ? "Active" : "Inactive",
            },
            {
              label: "Availability",
              value: `${onDemandInstance.availability || 0} spaces`,
            },
          ].map(({ label, value }, rowIndex) => (
            <tr key={`on-demand-${label}`} className="border border-stroke">
              <td className="font-semibold p-3 border border-r w-1/2">
                {label}:
              </td>
              <td
                className={cn(
                  "px-3",
                  label === "Status"
                    ? value === "Active"
                      ? "text-emerald-500 font-medium"
                      : "text-red font-medium"
                    : ""
                )}
              >
                {value}
              </td>
            </tr>
          )),
          // Add a spacer after On Demand if there are regular dates
          ...(sortedDates.length > 0
            ? [
                <tr key="spacer-on-demand" className="h-4">
                  <td colSpan="2"></td>
                </tr>,
              ]
            : []),
        ]}

        {/* Render regular dates */}
        {sortedDates.flatMap((instance, index) => [
          ...[
            {
              label: "Commencement Term",
              value: format(new Date(instance.instance_name), "MMMM yyyy"),
            },
            { label: "Start Date", value: formatDate(instance.start_date) },
            {
              label: "Last Join Date",
              value: formatDate(instance.last_join_date),
            },
            { label: "End Date", value: formatDate(instance.end_date) },
            { label: "Results Date", value: formatDate(instance.results_date) },
            {
              label: "Open for Enrollment",
              value: instance.status ? "Yes" : "No",
            },
            {
              label: "Availability",
              value: `${instance.availability || 0} spaces`,
            },
          ].map(({ label, value }, rowIndex) => (
            <tr key={`${index}-${label}`} className="border border-stroke">
              <td className="font-semibold p-3 border border-r w-1/2">
                {label}:
              </td>
              <td
                className={cn(
                  "px-3",
                  label === "Open for Enrollment"
                    ? value === "Yes"
                      ? "text-emerald-500 font-medium"
                      : "text-red font-medium"
                    : ""
                )}
              >
                {value}
              </td>
            </tr>
          )),
          // Add a spacer row after each regular date, except the last one
          ...(index < sortedDates.length - 1
            ? [
                <tr key={`spacer-${index}`} className="h-4">
                  <td colSpan="2"></td>
                </tr>,
              ]
            : []),
        ])}
      </tbody>
    </table>
  );
};

const DatesForm = ({ initialData, courseID }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      course_instances:
        initialData.length > 0
          ? initialData.map((instance) => ({
              ...instance,
              isOnDemand: instance.instance_name === "On Demand",
              results_weeks: calculateWeeksBetweenDates(
                instance.end_date,
                instance.results_date
              ),
              status: instance.status || false,
              availability: instance.availability || 0,
            }))
          : [
              {
                instance_name: "",
                isOnDemand: false,
                status: false,
                availability: 0,
                start_date: "",
                last_join_weeks: "4",
                last_join_date: "",
                end_date: "",
                results_weeks: "2",
                results_date: "",
              },
            ],
    },
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    name: "course_instances",
    control: form.control,
  });

  const sortedFields = [...fields].sort((a, b) => {
    if (!a.instance_name || !b.instance_name) return 0;
    return compareAsc(new Date(a.instance_name), new Date(b.instance_name));
  });

  const router = useRouter();
  const { toast } = useToast();

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const calculateLastJoinDate = (startDate, weeks, index) => {
    if (startDate && weeks) {
      const weeksNumber = parseInt(weeks, 10);
      const lastJoinDate = addWeeks(new Date(startDate), weeksNumber);
      form.setValue(`course_instances.${index}.last_join_date`, lastJoinDate);
    }
  };

  const calculateResultsDate = (endDate, weeks, index) => {
    if (endDate && weeks) {
      const weeksNumber = parseInt(weeks, 10);
      const resultsDate = addWeeks(new Date(endDate), weeksNumber);
      form.setValue(`course_instances.${index}.results_date`, resultsDate);
    }
  };

  // console.log("values", form.getValues());
  // console.log("errors", form.formState.errors);

  const onSubmit = (values) => {
    if (values.course_instances.length > 0) {
      values.course_instances = values.course_instances.map((instance) => {
        // Don't format On Demand instance names
        if (instance.isOnDemand) {
          return {
            ...instance,
            instance_name: "On Demand"
          };
        }
        // Format date for regular instances
        return {
          ...instance,
          instance_name: format(instance.instance_name, "MMMM yyyy")
        };
      });
    }

    startTransition(() => {
      courses(values, courseID)
        .then((data) => {
          if (data?.success) {
            toast({
              variant: "success",
              title: data.success,
            });

            toggleEdit();
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
          toggleEdit();
          toast({
            variant: "destructive",
            title: error,
          });
        })
        .finally(() => {
          toggleEdit();
        });
    });
  };

  console.log(form.formState.errors)

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      initialData.map((data) => {
        if (data.instance_name && data.instance_name !== "On Demand") {
          data.instance_name = new Date(data.instance_name);
        }
      });
    }
  }, [initialData]);

  return (
    <div className="flex flex-col gap-9 mt-6">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 font-medium flex items-center justify-between">
          Course Dates
          <Button variant="ghost" className="gap-x-2" onClick={toggleEdit}>
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <PencilIcon className="size-4" />
                Edit Dates
              </>
            )}
          </Button>
        </div>
        {!isEditing && (
          <div
            className={cn(
              "text-sm mt-2 px-6.5 py-4",
              !initialData.length > 0 && "italic"
            )}
          >
            {initialData.some((instance) => instance.instance_name === "On Demand") ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">On Demand</Badge>
                  <span className="text-muted-foreground text-sm">
                    This course allows flexible start dates
                  </span>
                </div>
              </div>
            ) : initialData.some(Boolean) ? (
              <DatesTable courseDates={initialData.map(date => ({
                ...date,
                instance_name: typeof date.instance_name === 'string' ? date.instance_name : format(new Date(date.instance_name), "MMMM yyyy")
              }))} />
            ) : (
              "No course dates have been set"
            )}
          </div>
        )}
        {isEditing && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-6.5 py-4"
            >
              <div className="mt-6 space-y-6">
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name={`course_instances.0.isOnDemand`}
                    render={({ field }) => {
                      const isOnDemand = form.watch(`course_instances.0.isOnDemand`);
                      return (
                        <FormItem>
                          <div className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">On Demand Course</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Allow students to start the course at any time
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    // Update all instances to match the main switch
                                    fields.forEach((_, index) => {
                                      form.setValue(`course_instances.${index}.isOnDemand`, checked);
                                      if (checked) {
                                        form.setValue(`course_instances.${index}.instance_name`, "On Demand");
                                        form.setValue(`course_instances.${index}.start_date`, null);
                                        form.setValue(`course_instances.${index}.last_join_weeks`, null);
                                        form.setValue(`course_instances.${index}.last_join_date`, null);
                                        form.setValue(`course_instances.${index}.end_date`, null);
                                        form.setValue(`course_instances.${index}.results_weeks`, null);
                                        form.setValue(`course_instances.${index}.results_date`, null);
                                      } else {
                                        // Reset to default values when switching back
                                        form.setValue(`course_instances.${index}.instance_name`, "");
                                        form.setValue(`course_instances.${index}.last_join_weeks`, "4");
                                        form.setValue(`course_instances.${index}.results_weeks`, "2");
                                      }
                                    });
                                    
                                    // If switching to on-demand, remove all but the first instance
                                    if (checked && fields.length > 1) {
                                      for (let i = fields.length - 1; i > 0; i--) {
                                        remove(i);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                            </div>
                            {field.value && (
                              <p className="text-sm text-muted-foreground border-t pt-3">
                                On Demand courses allow students to:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>Start at any time</li>
                                  <li>Study at their own pace</li>
                                  <li>Complete the course when ready</li>
                                </ul>
                              </p>
                            )}
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {!form.watch(`course_instances.0.isOnDemand`) && fields.length < 12 && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      append({
                        instance_name: "",
                        isOnDemand: false,
                        status: false,
                        availability: 0,
                        start_date: "",
                        last_join_weeks: "4",
                        last_join_date: "",
                        end_date: "",
                        results_weeks: "2",
                        results_date: "",
                      })
                    }
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Course Date
                  </Button>
                )}

                {sortedFields.map((item, index) => (
                  <div key={item.id} className={index > 0 ? "pt-4" : undefined}>
                    {!form.watch(`course_instances.0.isOnDemand`) && (
                      <>
                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.instance_name`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Commencement</FormLabel>
                                  <FormControl>
                                    <MonthYearPicker
                                      value={field.value && new Date(field.value)}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.availability`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Availability</FormLabel>
                                  <FormControl>
                                    <input
                                      type="number"
                                      min="0"
                                      max="999"
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.start_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <DateTimePicker
                                      granularity="day"
                                      value={field.value}
                                      onChange={(date) => {
                                        field.onChange(date);
                                        const weeks = form.getValues(
                                          `course_instances.${index}.last_join_weeks`
                                        );
                                        calculateLastJoinDate(date, weeks, index);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.last_join_weeks`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weeks Allowed for Last Join</FormLabel>
                                  <Select
                                    onValueChange={(e) => {
                                      field.onChange(e);
                                      const startDate = form.getValues(
                                        `course_instances.${index}.start_date`
                                      );
                                      calculateLastJoinDate(startDate, e, index);
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select weeks" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 13 }, (_, i) => i).map(
                                        (week) => (
                                          <SelectItem
                                            key={week}
                                            value={week.toString()}
                                          >
                                            {week} {week === 1 ? "week" : "weeks"}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.last_join_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Join Date</FormLabel>
                                  <FormControl>
                                    <DateTimePicker
                                      granularity="day"
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.end_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <DateTimePicker
                                      granularity="day"
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.results_weeks`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weeks for Results Date</FormLabel>
                                  <Select
                                    onValueChange={(e) => {
                                      field.onChange(e);
                                      const endDate = form.getValues(
                                        `course_instances.${index}.end_date`
                                      );
                                      calculateResultsDate(endDate, e, index);
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select weeks" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 13 }, (_, i) => i).map(
                                        (week) => (
                                          <SelectItem
                                            key={week}
                                            value={week.toString()}
                                          >
                                            {week} {week === 1 ? "week" : "weeks"}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="w-full xl:w-1/2">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.results_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Results Date</FormLabel>
                                  <FormControl>
                                    <DateTimePicker
                                      granularity="day"
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                          <div className="w-full">
                            <FormField
                              control={form.control}
                              name={`course_instances.${index}.status`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Open for Enrollment
                                    </FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Allow students to enroll in this course
                                      instance
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(index)}
                        className="size-8 p-0 lg:mb-4"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-x-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default DatesForm;
