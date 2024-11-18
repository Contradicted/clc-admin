"use client";

import { CalendarIcon, Loader2, PaperclipIcon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import countries from "i18n-iso-countries";
import nationalities from "i18n-nationality";
import countriesEnglish from "i18n-iso-countries/langs/en.json";
import nationalitiesEnglish from "i18n-nationality/langs/en.json";

import { fileColumns } from "@/components/columns";
import FilesTable from "@/components/files-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import { popularCountries, popularNationalities } from "@/constants";

import { cn, formatDate, formatImmigrationStatus, isAdult } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import { updatePersonalDetails } from "@/actions/update-application";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

countries.registerLocale(countriesEnglish);
nationalities.registerLocale(nationalitiesEnglish);

const nameRegex = /^[A-Za-z\s-]+$/;

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(1, "First name is required").regex(nameRegex, {
      message: "First name cannot contain numbers",
    }),
    lastName: z.string().min(1, "Last name is required").regex(nameRegex, {
      message: "Last name cannot contain numbers",
    }),
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z
      .date({ required_error: "Date of birth is required" })
      .refine(isAdult, {
        message: "You must be aged 18 or older",
      }),
    placeOfBirth: z
      .string()
      .min(1, "Place of birth is required")
      .regex(nameRegex, {
        message: "First name cannot contain numbers",
      }),
    countryOfBirth: z.string().min(1, "Country of birth is required"),
    identificationNo: z.string().min(1, "Identification number is required"),
    nationality: z.string().min(1, "Nationality is required"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
    email: z.string().email("Invalid email address"),
    mobileNo: z.string().min(1, "Mobile number is required"),
    homeTelephoneNo: z.string().optional(),
    emergency_contact_name: z
      .string({
        required_error: "Emergency contact name is required",
      })
      .min(1, { message: "Emergency contact name is required" })
      .regex(nameRegex, {
        message: "Emergency contact name cannot contain numbers",
      }),
    emergency_contact_no: z
      .string({
        required_error: "Emergency contact number is required",
      })
      .trim()
      .min(1, { message: "Emergency contact number is required" })
      .max(13, { message: "Maximum 12 digits allowed" }),
    tuitionFees: z.string().min(1, "Tuition fees are required"),
    isEnglishFirstLanguage: z.boolean(),
    entryDateToUK: z
      .date()
      .optional()
      .refine(
        (date) => {
          if (date) {
            return date < new Date(Date.now());
          }

          return true;
        },
        {
          message: "The date must be before today",
        }
      ),
    immigration_status: z
      .enum(["settled", "pre_settled", ""])
      .optional()
      .nullable(),
    share_code: z
      .string()
      .optional()
      .nullable()
      .refine(
        (value) => {
          if (value) {
            // Remove spaces and check if it's 9 characters long
            const cleanedValue = value.replace(/\s/g, "");
            return /^[A-Za-z0-9]{9}$/.test(cleanedValue);
          }
          return true;
        },
        {
          message:
            "Share code must be 9 characters long and contain only letters and numbers",
        }
      )
      .refine(
        (value) => {
          if (value) {
            // Check if the share code follows the pattern: XXX-XXX-XXX (allowing spaces)
            return /^[A-Za-z0-9]{3}[\s-]?[A-Za-z0-9]{3}[\s-]?[A-Za-z0-9]{3}$/.test(
              value
            );
          }
          return true;
        },
        {
          message:
            "Share code must be in the format XXX-XXX-XXX (spaces or hyphens optional)",
        }
      ),
    files: z.object({
      photo: z.array(z.any()).optional(),
      identification: z.array(z.any()).optional(),
      immigration: z.array(z.any()).optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.nationality !== "British") {
        return !!data.immigration_status;
      }
      return true;
    },
    {
      message: "Immigration status is required for non-British nationals",
      path: ["immigration_status"],
    }
  )
  .refine(
    (data) => {
      if (
        data.nationality !== "British" &&
        data.immigration_status === "pre_settled"
      ) {
        return !!data.share_code;
      }
      return true;
    },
    {
      message: "Share code is required for pre-settled status",
      path: ["share_code"],
    }
  );

const PersonalDetails = ({ application }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const now = new Date();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      title: application.title,
      firstName: application.firstName,
      lastName: application.lastName,
      gender: application.gender,
      dateOfBirth: application.dateOfBirth,
      placeOfBirth: application.placeOfBirth,
      countryOfBirth: application.countryOfBirth,
      entryDateToUK: application.entryDateToUK || undefined,
      identificationNo: application.identificationNo,
      immigration_status: application.immigration_status || "",
      share_code: application.share_code || "",
      nationality: application.nationality,
      addressLine1: application.addressLine1,
      addressLine2: application.addressLine2 || "",
      city: application.city,
      postcode: application.postcode,
      email: application.email,
      mobileNo: application.mobileNo,
      homeTelephoneNo: application.homeTelephoneNo,
      emergency_contact_name: application.emergency_contact_name,
      emergency_contact_no: application.emergency_contact_no,
      tuitionFees: application.tuitionFees,
      isEnglishFirstLanguage: application.isEnglishFirstLanguage,
      files: {
        photo: application.photoUrl
          ? [{ name: application.photoName, url: application.photoUrl }]
          : [],
        identification: application.identificationNoUrl
          ? [{ name: "Identification", url: application.identificationNoUrl }]
          : [],
        immigration: application.immigration_url
          ? [
              {
                name: application.immigration_name,
                url: application.immigration_url,
              },
            ]
          : [],
      },
    },
    resolver: zodResolver(formSchema),
  });

  const nationality = form.watch("nationality");
  const immigrationStatus = form.watch("immigration_status");
  const countryOfBirth = form.watch("countryOfBirth");

  const dropzone = {
    accept: {
      "application/msword": [".doc"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // Max 5MB per file
    validator: (file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        return {
          code: "file-invalid-type",
          message: "Invalid file type. Please try a different file",
        };
      }
      if (file.size > 5 * 1024 * 1024) {
        return {
          code: "file-too-large",
          message: "File size must be less than 5MB",
        };
      }
      return null;
    },
  };

  useEffect(() => {
    if (nationality === "British") {
      form.setValue("immigration_status", "");
      form.setValue("share_code", "");
      form.setValue("files.immigration", []);
    }
  }, [nationality, form]);

  // useEffect(() => {
  //   if (immigrationStatus !== "pre_settled") {
  //     form.setValue("share_code", "");
  //   }
  // }, [immigrationStatus, form]);

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  console.log(form.formState.errors);

  const onSubmit = (values) => {
    const formData = new FormData();

    // Append form values to formData
    Object.keys(values).forEach((key) => {
      if (key !== "files") {
        formData.append(key, values[key]);
      }
    });

    // Handle file uploads and append to formData
    Object.keys(values.files).forEach((fileType) => {
      const files = values.files[fileType];
      if (files && files.length > 0) {
        const file = files[0];
        if (file instanceof File) {
          formData.append(`${fileType}File`, file);
        } else if (file.url) {
          formData.append(`${fileType}ExistingFile`, JSON.stringify(file));
        }
      }
    });

    startTransition(() => {
      updatePersonalDetails(formData, application.id).then((data) => {
        if (data?.success) {
          toast({
            variant: "success",
            title: data.success,
          });

          router.refresh();
        }

        if (data?.error) {
          toast({
            title: data.error,
            variant: "destructive",
          });
        }
      });
    });
  };

  const fileData = [];

  if (application.photoUrl) {
    fileData.push({
      name: "Profile Picture",
      url: application.photoUrl,
    });
  }

  if (application.identificationNoUrl) {
    fileData.push({
      name: "Identification",
      url: application.identificationNoUrl,
    });
  }

  if (application.immigration_url) {
    fileData.push({
      name: "Immigration Document",
      url: application.immigration_url,
    });
  }

  if (application.signatureUrl) {
    fileData.push({
      name: "Signature",
      url: application.signatureUrl,
    });
  }

  return (
    <div className="border-b border-stroke space-y-4 my-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="w-full space-y-4 pb-4">
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">Title</div>
              {isEditing ? (
                <FormField
                  name="title"
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
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent position="top">
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
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.title}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                First Name
              </div>
              {isEditing ? (
                <FormField
                  name="firstName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.firstName}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Last Name
              </div>
              {isEditing ? (
                <FormField
                  name="lastName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.lastName}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">Gender</div>
              {isEditing ? (
                <FormField
                  name="gender"
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
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent position="top">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.gender}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Date of Birth
              </div>
              {isEditing ? (
                <FormField
                  name="dateOfBirth"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {formatDate(application.dateOfBirth)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Place of Birth
              </div>
              {isEditing ? (
                <FormField
                  name="placeOfBirth"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.placeOfBirth}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Country of Birth
              </div>
              {isEditing ? (
                <FormField
                  name="countryOfBirth"
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
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Popular Countries</SelectLabel>
                              {popularCountries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>All Countries</SelectLabel>
                              {Object.entries(countries.getNames("en"))
                                .filter(
                                  ([code, name]) =>
                                    !popularCountries.includes(name)
                                )
                                .map(([code, name]) => (
                                  <SelectItem key={code} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.countryOfBirth}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Passport / National ID Card No.
              </div>
              {isEditing ? (
                <FormField
                  name="identificationNo"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.identificationNo}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Nationality
              </div>
              {isEditing ? (
                <FormField
                  name="nationality"
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
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Popular Nationalities</SelectLabel>
                              {popularNationalities.map((nationality) => (
                                <SelectItem
                                  key={nationality}
                                  value={nationality}
                                >
                                  {nationality}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>All Countries</SelectLabel>
                              {Object.entries(nationalities.getNames("en"))
                                .filter(
                                  ([code, nationality]) =>
                                    !popularNationalities.includes(nationality)
                                )
                                .sort((a, b) => a[1].localeCompare(b[1]))
                                .map(([code, nationality]) => (
                                  <SelectItem key={code} value={nationality}>
                                    {nationality}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.nationality}
                </p>
              )}
            </div>

            {(application.entryDateToUK ||
              (nationality !== "British" &&
                countryOfBirth !== "United Kingdom")) && (
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%]">
                  Entry Date to UK
                </div>
                {isEditing ? (
                  <FormField
                    name="entryDateToUK"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="w-full">
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
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="flex flex-wrap font-medium text-black w-full">
                    {application.entryDateToUK
                      ? formatDate(application.entryDateToUK)
                      : "-"}
                  </p>
                )}
              </div>
            )}

            {nationality && nationality !== "British" && (
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%]">
                  Immigration Status
                </div>
                {isEditing ? (
                  <FormField
                    name="immigration_status"
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
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="settled">
                                  Settled (Indefinite Leave)
                                </SelectItem>
                                <SelectItem value="pre_settled">
                                  Pre Settled (Limited Leave)
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="flex flex-wrap font-medium text-black w-full">
                    {formatImmigrationStatus(application.immigration_status)}
                  </p>
                )}
              </div>
            )}

            {immigrationStatus && (
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%]">
                  Share Code
                </div>
                {isEditing ? (
                  <FormField
                    name="share_code"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            disabled={isSaving}
                            onChange={(e) => {
                              const value = e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "");
                              const formattedValue = value
                                .replace(/(.{3})/g, "$1 ")
                                .trim();
                              field.onChange(formattedValue);
                            }}
                            maxLength={11}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="flex flex-wrap font-medium text-black w-full">
                    {application.share_code || "-"}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Address Line 1
              </div>
              {isEditing ? (
                <FormField
                  name="addressLine1"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.addressLine1}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Address Line 2
              </div>
              {isEditing ? (
                <FormField
                  name="addressLine2"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.addressLine2 || "-"}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">City</div>
              {isEditing ? (
                <FormField
                  name="city"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.city}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Zip / Postal Code
              </div>
              {isEditing ? (
                <FormField
                  name="postcode"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSaving}
                          onChange={(e) => {
                            let value = e.target.value
                              .toUpperCase()
                              .replace(/\s/g, "");
                            if (value.length > 4) {
                              value =
                                value.slice(0, -3) + " " + value.slice(-3);
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.postcode}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">Email</div>
              {isEditing ? (
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input type="email" {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.email}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Mobile No.
              </div>
              {isEditing ? (
                <FormField
                  name="mobileNo"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <PhoneInput
                          {...field}
                          disabled={isSaving}
                          international
                          defaultCountry="GB"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {formatPhoneNumberIntl(application.mobileNo)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Home Telephone No.
              </div>
              {isEditing ? (
                <FormField
                  name="homeTelephoneNo"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <PhoneInput
                          {...field}
                          disabled={isSaving}
                          international
                          defaultCountry="GB"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {formatPhoneNumberIntl(application.homeTelephoneNo) || "-"}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Emergency Contact Name
              </div>
              {isEditing ? (
                <FormField
                  name="emergency_contact_name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.emergency_contact_name || "-"}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Emergency Contact No.
              </div>
              {isEditing ? (
                <FormField
                  name="emergency_contact_no"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <PhoneInput
                          {...field}
                          disabled={isSaving}
                          international
                          defaultCountry="GB"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {formatPhoneNumberIntl(application.emergency_contact_no) ||
                    "-"}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Tuition Fee
              </div>
              {isEditing ? (
                <FormField
                  name="tuitionFees"
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
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Parents">Parents</SelectItem>
                            <SelectItem value="Family Members">
                              Family Members
                            </SelectItem>
                            <SelectItem value="Employers">Employers</SelectItem>
                            <SelectItem value="Self">Self</SelectItem>
                            <SelectItem value="Student Loan Company England (SLC)">
                              Student Loan Company England (SLC)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.tuitionFees}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Is English Your First Language
              </div>
              {isEditing ? (
                <FormField
                  name="isEnglishFirstLanguage"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "yes")
                          }
                          defaultValue={field.value ? "yes" : "no"}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent position="top">
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.isEnglishFirstLanguage ? "Yes" : "No"}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {isEditing && (
                <FormField
                  control={form.control}
                  name="files.photo"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FileUploader
                        value={field.value}
                        onValueChange={field.onChange}
                        dropzoneOptions={dropzone}
                        disabled={isSaving}
                      >
                        <FileInput className="pl-3">
                          <Button
                            type="button"
                            size="sm"
                            className="flex items-center gap-x-2"
                          >
                            <UploadIcon className="size-4" />
                            Upload Profile Photo
                          </Button>
                        </FileInput>
                        {field.value && field.value.length > 0 && (
                          <FileUploaderContent>
                            {field.value.map((file, i) => (
                              <FileUploaderItem key={i} index={i}>
                                <PaperclipIcon className="h-4 w-4 stroke-current" />
                                <span>{file.name}</span>
                              </FileUploaderItem>
                            ))}
                          </FileUploaderContent>
                        )}
                      </FileUploader>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex gap-3">
              {isEditing && (
                <FormField
                  control={form.control}
                  name="files.identification"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FileUploader
                        value={field.value}
                        onValueChange={field.onChange}
                        dropzoneOptions={dropzone}
                        disabled={isSaving}
                      >
                        <FileInput className="pl-3">
                          <Button
                            type="button"
                            size="sm"
                            className="flex items-center gap-x-2"
                          >
                            <UploadIcon className="size-4" />
                            Upload Identification File
                          </Button>
                        </FileInput>
                        {field.value && field.value.length > 0 && (
                          <FileUploaderContent>
                            {field.value.map((file, i) => (
                              <FileUploaderItem key={i} index={i}>
                                <PaperclipIcon className="h-4 w-4 stroke-current" />
                                <span>{file.name}</span>
                              </FileUploaderItem>
                            ))}
                          </FileUploaderContent>
                        )}
                      </FileUploader>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {nationality !== "British" && (
              <div className="flex gap-3">
                {isEditing && (
                  <FormField
                    control={form.control}
                    name="files.immigration"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FileUploader
                          value={field.value}
                          onValueChange={field.onChange}
                          dropzoneOptions={dropzone}
                          disabled={isSaving}
                        >
                          <FileInput className="pl-3">
                            <Button
                              type="button"
                              size="sm"
                              className="flex items-center gap-x-2"
                            >
                              <UploadIcon className="size-4" />
                              Upload Immigration File
                            </Button>
                          </FileInput>
                          {field.value && field.value.length > 0 && (
                            <FileUploaderContent>
                              {field.value.map((file, i) => (
                                <FileUploaderItem key={i} index={i}>
                                  <PaperclipIcon className="h-4 w-4 stroke-current" />
                                  <span>{file.name}</span>
                                </FileUploaderItem>
                              ))}
                            </FileUploaderContent>
                          )}
                        </FileUploader>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>
          {fileData.length > 0 && (
            <FilesTable data={fileData} columns={fileColumns} />
          )}
        </form>
      </Form>
    </div>
  );
};

export default PersonalDetails;
