"use client";

import { courses } from "@/actions/courses";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    startDate: z
      .date()
      .refine((date) => date >= new Date(), {
        message: "Start date cannot be before the current date",
      })
      .optional(),
    last_join_date: z
      .date()
      .refine((date) => date > new Date(), {
        message: "Last join date cannot be before or on the current date",
      })
      .optional(),
    endDate: z
      .date()
      .refine((date) => date > new Date(), {
        message: "End date cannot be before or on the current date",
      })
      .optional(),
    resultsDate: z
      .date()
      .refine((date) => date >= new Date(), {
        message: "Results date cannot be before the current date",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.last_join_date) {
        return data.last_join_date >= data.startDate;
      }
      return true;
    },
    {
      message: "Last join date must be on or after the start date",
      path: ["last_join_date"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after the start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.last_join_date && data.endDate) {
        return data.endDate > data.last_join_date;
      }
      return true;
    },
    {
      message: "End date must be after the last join date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.resultsDate) {
        return data.resultsDate > data.startDate;
      }
      return true;
    },
    {
      message: "Results date must be after the start date",
      path: ["resultsDate"],
    }
  )
  .refine(
    (data) => {
      if (data.last_join_date && data.resultsDate) {
        return data.resultsDate > data.last_join_date;
      }
      return true;
    },
    {
      message: "Results date must be after the last join date",
      path: ["resultsDate"],
    }
  )
  .refine(
    (data) => {
      if (data.endDate && data.resultsDate) {
        return data.resultsDate >= data.endDate;
      }
      return true;
    },
    {
      message: "Results date must be on or after the end date",
      path: ["resultsDate"],
    }
  )
  .superRefine((dates, ctx) => {
    const initialDates = ctx.initialData || {};
    const hasChanges = Object.keys(dates).some(
      (key) =>
        dates[key] && dates[key].getTime() !== initialDates[key]?.getTime()
    );

    if (!hasChanges) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one date must be changed to save",
      });
    }

    if (
      !dates.startDate &&
      !dates.last_join_date &&
      !dates.endDate &&
      !dates.resultsDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one date must be set",
      });
    }
  });

const DatesTable = ({ courseDates }) => {
  return (
    <table className="w-full">
      <tbody>
        {[
          { label: "Start Date", value: courseDates[0] },
          { label: "Last Join Date", value: courseDates[1] },
          { label: "End Date", value: courseDates[2] },
          { label: "Results Date", value: courseDates[3] },
        ].map(
          ({ label, value }) =>
            value && (
              <tr key={label} className="border border-stroke">
                <td className="font-semibold p-3 border border-r w-1/4">
                  {label}:
                </td>
                <td className="px-3">{formatDate(value)}</td>
              </tr>
            )
        )}
      </tbody>
    </table>
  );
};

const DatesForm = ({ initialData, courseID }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      startDate: initialData.startDate || undefined,
      last_join_date: initialData.last_join_date || undefined,
      endDate: initialData.endDate || undefined,
      resultsDate: initialData.resultsDate || undefined,
    },
    resolver: zodResolver(formSchema),
  });

  const courseDates = [
    initialData.startDate,
    initialData.last_join_date,
    initialData.endDate,
    initialData.resultsDate,
  ];

  const router = useRouter();
  const { toast } = useToast();

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const onSubmit = (values) => {
    console.log(form.formState.errors);
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
          <p
            className={cn(
              "text-sm mt-2 px-6.5 py-4",
              !courseDates.every(Boolean) && "italic"
            )}
          >
            {courseDates.some(Boolean) ? (
              <DatesTable courseDates={courseDates} />
            ) : (
              "No course dates have been set"
            )}
          </p>
        )}
        {isEditing && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-4 px-6.5 py-4"
            >
              <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Start Date</FormLabel>
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
                <div className="w-full xl:w-1/2">
                  <FormField
                    control={form.control}
                    name="last_join_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Last Join Date</FormLabel>
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
                    name="endDate"
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
                <div className="w-full xl:w-1/2">
                  <FormField
                    control={form.control}
                    name="resultsDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Results Date</FormLabel>
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
              <div className="flex items-center gap-x-2">
                <Button
                  type="submit"
                  disabled={isPending || !form.formState.isValid}
                >
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
