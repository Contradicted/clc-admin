"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { staff } from "@/actions/staff";
import { useRouter } from "next/navigation";
import { cn, formatDateTime } from "@/lib/utils";
import { useEditing } from "@/providers/editing-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  visa_duration: z
    .number()
    .min(1, { message: "Visa duration is required" })
    .refine((value) => value > 0, {
      message: "Visa duration must be greater than 0",
    }),
  visa_expiry_date: z.date({
    required_error: "Visa expiry date is required",
  }),
  visa_expiry_reminder: z.date({
    required_error: "Visa expiry reminder is required",
  }),
});

const VisaDetailsForm = ({ initialData, staffID }) => {
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const { isEditing, setIsEditing } = useEditing();

  const now = new Date();
  const router = useRouter();
  const { toast } = useToast();

  const requiredFields = [
    initialData.visa_duration,
    initialData.visa_expiry_date,
    initialData.visa_expiry_reminder,
  ];

  const form = useForm({
    defaultValues: {
      visa_duration: initialData.visa_duration || undefined,
      visa_expiry_date: initialData.visa_expiry_date
        ? new Date(initialData.visa_expiry_date)
        : undefined,
      visa_expiry_reminder: initialData.visa_expiry_reminder
        ? new Date(initialData.visa_expiry_reminder)
        : undefined,
    },
    resolver: zodResolver(formSchema),
  });

  const visaExpiryDate = form.watch("visa_expiry_date");

  // Update visa_expiry_reminder when visa_expiry_date changes
  useEffect(() => {
    if (visaExpiryDate) {
      const reminderDate = new Date(
        visaExpiryDate.getTime() - 6 * 7 * 24 * 60 * 60 * 1000
      );
      form.setValue("visa_expiry_reminder", reminderDate);
    }
  }, [visaExpiryDate, form]);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setIsFormEditing(!isFormEditing);
  };

  const onSubmit = (values) => {
    startTransition(() => {
      staff(values, staffID)
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
          toast({
            variant: "destructive",
            title: error.message,
          });
        })
        .finally(() => {
          setIsEditing(false);
        });
    });
  };

  return (
    <div className="flex flex-col gap-9">
      <div className="relative px-6.5 py-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center">
              <h3 className="w-full text-lg font-semibold text-black">
                Visa Information
              </h3>
              {isFormEditing && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              )}
            </div>
            <div className="absolute -right-4 -top-4 bg-gray rounded-full size-8 flex items-center justify-center">
              <Button
                type="button"
                variant="icon"
                onClick={toggleEdit}
                className="group"
                disabled={isEditing && !isFormEditing}
              >
                {isFormEditing ? (
                  <X className="size-4 group-hover:text-black/70" />
                ) : (
                  <Pencil className="size-4 group-hover:text-black/70" />
                )}
              </Button>
            </div>
            {isFormEditing && (
              <div className="w-full mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-3">
                <FormField
                  control={form.control}
                  name="visa_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Duration</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder="Eg. 3"
                        />
                      </FormControl>
                      <FormDescription>Enter number in years</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visa_expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Expiry Date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal rounded-[10px] text-sm",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.visa_expiry_date &&
                                  "border-red" // Add this line
                              )}
                              disabled={isSaving}
                            >
                              {field.value ? (
                                formatDateTime(new Date(field.value)).date
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown-buttons"
                              selected={new Date(field.value)}
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
                <FormField
                  control={form.control}
                  name="visa_expiry_reminder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Expiry Reminder</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal rounded-[10px] text-sm",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.visa_expiry_reminder &&
                                  "border-red"
                              )}
                              disabled={true} // Always disabled
                            >
                              {field.value ? (
                                formatDateTime(field.value).date
                              ) : (
                                <span>Automatically set</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown-buttons"
                              selected={field.value}
                              fromYear={now.getFullYear()}
                              toYear={now.getFullYear() + 10}
                              onSelect={field.onChange}
                              weekStartsOn={1}
                              disabled={true} // Calendar is always disabled
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
            )}
            {!isFormEditing && (
              <div
                className={cn(
                  "text-sm mt-2",
                  !requiredFields.every(Boolean) && "italic"
                )}
              >
                {requiredFields.some(Boolean) ? (
                  <div className="mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-4">
                    <div className="flex flex-col gap-y-2 break-words">
                      <p className="text-sm text-zinc-400 font-medium">
                        Visa Duration
                      </p>
                      <span className="text-sm font-medium text-graydark">
                        {initialData.visa_duration
                          ? `${initialData.visa_duration} yrs`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-y-2 break-words">
                      <p className="text-sm text-zinc-400 font-medium">
                        Visa Expiry Date
                      </p>
                      <span className="text-sm font-medium text-graydark">
                        {initialData.visa_expiry_date
                          ? formatDateTime(
                              new Date(initialData.visa_expiry_date)
                            ).date
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-y-2 break-words">
                      <p className="text-sm text-zinc-400 font-medium">
                        Visa Expiry Reminder
                      </p>
                      <span className="text-sm font-medium text-graydark">
                        {initialData.visa_expiry_reminder
                          ? formatDateTime(
                              new Date(initialData.visa_expiry_reminder)
                            ).date
                          : "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  "No visa information provided"
                )}
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default VisaDetailsForm;
