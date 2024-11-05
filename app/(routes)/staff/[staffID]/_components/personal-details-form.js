"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import nationalities from "i18n-nationality";
import nationalitiesEnglish from "i18n-nationality/langs/en.json";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { staff } from "@/actions/staff";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDateTime, isAdult } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useEditing } from "@/providers/editing-provider";

nationalities.registerLocale(nationalitiesEnglish);

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  dateOfBirth: z
    .date({
      required_error: "A date of birth is required",
    })
    .refine(isAdult, {
      message: "You must be aged 18 or older",
    })
    .refine(
      (date) => {
        return date < new Date(Date.now());
      },
      {
        message: "The date must be before today",
      }
    ),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  nationality: z.string().min(1, { message: "Nationality is required" }),
});

const PersonalDetailsForm = ({ initialData, staffID }) => {
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const { isEditing, setIsEditing } = useEditing();

  const router = useRouter();
  const { toast } = useToast();
  const now = new Date();

  const form = useForm({
    defaultValues: {
      title: initialData.title || "",
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      dateOfBirth: initialData.dateOfBirth || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      nationality: initialData.nationality || "",
    },
    resolver: zodResolver(formSchema),
  });

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
          setIsFormEditing(false);
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
                Personal Information
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <SelectTrigger
                            className={
                              form.formState.errors.title && "border-red"
                            }
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mr">Mr</SelectItem>
                            <SelectItem value="Mrs">Mrs</SelectItem>
                            <SelectItem value="Ms">Ms</SelectItem>
                            <SelectItem value="Miss">Miss</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Eg. John"
                          className={
                            form.formState.errors.firstName && "border-red"
                          }
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Eg. Doe"
                          className={
                            form.formState.errors.lastName && "border-red"
                          }
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal rounded-[10px] text-sm",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.dateOfBirth &&
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
                  name="email"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Eg. john@example.com"
                          className={
                            form.formState.errors.email && "border-red"
                          }
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          {...field}
                          placeholder="+44 64625468436"
                          className={
                            form.formState.errors.phone && "border-red"
                          }
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className={
                            form.formState.errors.nationality && "border-red"
                          }
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent position="top">
                            {Object.entries(nationalities.getNames("en")).map(
                              ([code, nationality]) => (
                                <SelectItem key={code} value={nationality}>
                                  {nationality}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {!isFormEditing && (
              <div className="mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-4">
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">Title</p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.title || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">
                    First Name
                  </p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.firstName}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">Last Name</p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.lastName}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">
                    Date of Birth
                  </p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.dateOfBirth
                      ? formatDateTime(initialData.dateOfBirth).date
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">Email</p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.email}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">Phone</p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.phone || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2 break-words">
                  <p className="text-sm text-zinc-400 font-medium">
                    Nationality
                  </p>
                  <span className="text-sm font-medium text-graydark">
                    {initialData.nationality || "-"}
                  </span>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
