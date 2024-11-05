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
          start_date: z
            .date({ invalid_type_error: "Start date is required" })
            .optional(),
          last_join_weeks: z.string().optional(),
          last_join_date: z
            .date({
              invalid_type_error: "Last join date is required",
            })
            // .refine((date) => date > new Date(), {
            //   message: "Last join date cannot be before or on the current date",
            // })
            .optional(),
          end_date: z
            .date({ invalid_type_error: "End date is required" })
            // .refine((date) => date > new Date(), {
            //   message: "End date cannot be before or on the current date",
            // })
            .optional(),
          results_date: z
            .date({ invalid_type_error: "Results date is required" })
            // .refine((date) => date >= new Date(), {
            //   message: "Results date cannot be before the current date",
            // })
            .optional(),
        })
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
  const sortedDates = [...courseDates].sort((a, b) =>
    compareAsc(new Date(a.instance_name), new Date(b.instance_name))
  );

  return (
    <table className="w-full">
      <tbody>
        {sortedDates.flatMap((instance, index) => [
          ...[
            // Spread the array of objects for each study mode
            {
              label: "Commencement Term",
              value: format(instance.instance_name, "MMMM yyyy"),
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
          // Add a spacer row after each study mode, except the last one
          ...(index < courseDates.length - 1
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
              results_weeks: calculateWeeksBetweenDates(
                instance.end_date,
                instance.results_date
              ),
            }))
          : [
              {
                instance_name: "",
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
      values.course_instances.map((instance) => {
        instance.instance_name = format(instance.instance_name, "MMMM yyyy");
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

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      initialData.map((data) => {
        if (data.instance_name) {
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
            {initialData.some(Boolean) ? (
              <DatesTable courseDates={initialData} />
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
              <div className="flex items-center gap-x-2">
                <Button
                  type="button"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() =>
                    append({
                      instance_name: "",
                      start_date: "",
                      last_join_weeks: "4",
                      last_join_date: "",
                      end_date: "",
                      results_weeks: "2",
                      results_date: "",
                    })
                  }
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>

              {sortedFields.map((item, index) => (
                <div key={item.id} className={index > 0 ? "pt-4" : undefined}>
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
                    <div className="w-full xl:w-1/2" />
                  </div>
                  <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`course_instances.${index}.start_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Start Date</FormLabel>
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
                                {[1, 2, 3, 4, 5, 6].map((week) => (
                                  <SelectItem
                                    key={week}
                                    value={week.toString()}
                                  >
                                    {week} week{week > 1 ? "s" : ""}
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
                  <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`course_instances.${index}.last_join_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Last Join Date</FormLabel>
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
                            <FormLabel>Course End Date</FormLabel>
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
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
                                  <SelectItem
                                    key={week}
                                    value={week.toString()}
                                  >
                                    {week} week{week > 1 ? "s" : ""}
                                  </SelectItem>
                                ))}
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
                            <FormLabel>Course Results Date</FormLabel>
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
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default DatesForm;
