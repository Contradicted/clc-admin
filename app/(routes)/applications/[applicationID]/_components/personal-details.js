"use client";

import {
  CalendarIcon,
  Loader2,
  PaperclipIcon,
  PencilIcon,
  UploadIcon,
} from "lucide-react";
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
  FormLabel,
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
              form="personal-details-form"
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
                    Title
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.title || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    First Name
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.firstName || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Last Name
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.lastName || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Gender
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.gender || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Date of Birth
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.dateOfBirth
                      ? formatDate(application.dateOfBirth)
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Tuition Fee
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.tuitionFees || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Place of Birth
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.placeOfBirth || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Country of Birth
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.countryOfBirth || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Nationality
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.nationality || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Passport / National ID Card No.
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.identificationNo || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Is English Your First Language?
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.isEnglishFirstLanguage ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Address Line 1
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.addressLine1 || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Address Line 2
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.addressLine2 || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      City
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.city || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Postcode
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.postcode || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Email
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.email || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Mobile Number
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.mobileNo
                        ? formatPhoneNumberIntl(application.mobileNo)
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Home Telephone
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.homeTelephoneNo
                        ? formatPhoneNumberIntl(application.homeTelephoneNo)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(application.entryDateToUK ||
              (nationality !== "British" &&
                countryOfBirth !== "United Kingdom")) && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Immigration Details
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500">
                        Entry Date to UK
                      </label>
                      <p className="mt-1 text-gray-900 break-words">
                        {application.entryDateToUK
                          ? formatDate(application.entryDateToUK)
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">
                        Immigration Status
                      </label>
                      <p className="mt-1 text-gray-900 break-words">
                        {application.immigration_status
                          ? formatImmigrationStatus(
                              application.immigration_status
                            )
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500">
                        Share Code
                      </label>
                      <p className="mt-1 text-gray-900 break-words">
                        {application.share_code || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Emergency Contact
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Name
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.emergency_contact_name || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Contact Number
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.emergency_contact_no
                        ? formatPhoneNumberIntl(
                            application.emergency_contact_no
                          )
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {fileData.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Documents
                </h3>
                <FilesTable columns={fileColumns} data={fileData} />
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form
              id="personal-details-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    name="title"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Title
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select title" />
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
                    name="firstName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          First Name
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="lastName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="gender"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Gender
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
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

                  <FormField
                    name="dateOfBirth"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Date of Birth
                        </FormLabel>
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
                                weekStartsOn={1}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="tuitionFees"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Tuition Fee
                        </FormLabel>
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
                              <SelectItem value="Employers">
                                Employers
                              </SelectItem>
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
                </div>

                <div className="space-y-4">
                  <FormField
                    name="placeOfBirth"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Place of Birth
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="countryOfBirth"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Country of Birth
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full">
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

                  <FormField
                    name="nationality"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Nationality
                        </FormLabel>
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
                                      !popularNationalities.includes(
                                        nationality
                                      )
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

                  <FormField
                    name="identificationNo"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Passport / National ID Card No.
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="isEnglishFirstLanguage"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Is English Your First Language?
                        </FormLabel>
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
                              <SelectItem value={true}>Yes</SelectItem>
                              <SelectItem value={false}>No</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      name="addressLine1"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Address Line 1
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="addressLine2"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Address Line 2
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="city"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            City
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="postcode"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Postcode
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      name="email"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="mobileNo"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Mobile Number
                          </FormLabel>
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

                    <FormField
                      name="homeTelephoneNo"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Home Telephone
                          </FormLabel>
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
                  </div>
                </div>
              </div>

              {(application.entryDateToUK ||
                (nationality !== "British" &&
                  countryOfBirth !== "United Kingdom")) && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Immigration Details
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <FormField
                        name="entryDateToUK"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-500">
                              Entry Date to UK
                            </FormLabel>
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
                                    weekStartsOn={1}
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {nationality && nationality !== "British" && (
                        <FormField
                          name="immigration_status"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-500">
                                Immigration Status
                              </FormLabel>
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
                      )}
                    </div>

                    <div className="space-y-4">
                      {immigrationStatus && (
                        <FormField
                          name="share_code"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-500">
                                Share Code
                              </FormLabel>
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
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Emergency Contact
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      name="emergency_contact_name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      name="emergency_contact_no"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Contact Number
                          </FormLabel>
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
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  File Uploads
                </h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="files.photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Profile Photo
                        </FormLabel>
                        <FormControl>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="files.identification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Identification Document
                        </FormLabel>
                        <FormControl>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {nationality !== "British" && (
                    <FormField
                      control={form.control}
                      name="files.immigration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Immigration Document
                          </FormLabel>
                          <FormControl>
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {fileData.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Uploaded Documents
                  </h3>
                  <FilesTable data={fileData} columns={fileColumns} />
                </div>
              )}
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default PersonalDetails;
