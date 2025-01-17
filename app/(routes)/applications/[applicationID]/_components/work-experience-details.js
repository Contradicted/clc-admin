"use client";

import { updateWorkExperience } from "@/actions/update-application";
import { fileColumns } from "@/components/columns";
import FilesTable from "@/components/files-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Loader2,
  PaperclipIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    hasWorkExperience: z.enum(["yes", "no"]),
    workExperience: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z.string().min(1, { message: "Job title is required" }),
          nameOfOrganisation: z
            .string()
            .min(1, { message: "Organisation name is required" }),
          natureOfJob: z
            .string()
            .min(1, { message: "Nature of Job is required" }),
          jobStartDate: z.date(),
          jobEndDate: z.date(),
          file: z.array(z.any()).optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.hasWorkExperience === "yes") {
        return (
          data.hasWorkExperience &&
          data.workExperience.length > 0 &&
          data.workExperience.every(
            (we) =>
              we.title &&
              we.nameOfOrganisation &&
              we.natureOfJob &&
              we.jobStartDate &&
              we.jobEndDate
          )
        );
      }
      return true;
    },
    {
      message: "Enter work experience",
      path: ["workExperience"],
    }
  );

const WorkExperienceDetails = ({ application }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const now = new Date();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      hasWorkExperience: application.hasWorkExperience ? "yes" : "no",
      workExperience: application.hasWorkExperience
        ? application.workExperience.length > 0
          ? application.workExperience.map((we) => ({
              ...we,
              file: we.url
                ? [{ name: we.fileName, url: we.url, alreadyExists: true }]
                : [],
            }))
          : []
        : undefined,
    },
    resolver: zodResolver(formSchema),
  });

  const watchHasWorkExperience = form.watch("hasWorkExperience");

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "workExperience",
  });

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  useEffect(() => {
    if (watchHasWorkExperience === "yes" && fields.length === 0) {
      append({
        title: "",
        nameOfOrganisation: "",
        natureOfJob: "",
        jobStartDate: "",
        jobEndDate: "",
      });
    } else if (watchHasWorkExperience === "no") {
      fields.forEach((_, index) => remove(index));
    }
  }, [watchHasWorkExperience, fields, fields.length, append, remove]);

  const onSubmit = (values) => {
    const formData = new FormData();

    formData.append("hasWorkExperience", values.hasWorkExperience);

    if (values.hasWorkExperience == "yes" && values.workExperience) {
      values.workExperience.forEach((we, index) => {
        formData.append(`workExperience[${index}][id]`, we.id || "");
        formData.append(`workExperience[${index}][title]`, we.title);
        formData.append(
          `workExperience[${index}][nameOfOrganisation]`,
          we.nameOfOrganisation
        );
        formData.append(
          `workExperience[${index}][natureOfJob]`,
          we.natureOfJob
        );
        formData.append(
          `workExperience[${index}][jobStartDate]`,
          we.jobStartDate
        );
        formData.append(`workExperience[${index}][jobEndDate]`, we.jobEndDate);

        if (we.file && we.file.length > 0) {
          const file = we.file[0];
          if (file instanceof File) {
            formData.append(`workExperience[${index}][file]`, file);
          } else if (file.alreadyExists) {
            formData.append(
              `workExperience[${index}][existingFile]`,
              JSON.stringify(file)
            );
          }
        }
      });
    }

    startTransition(() => {
      updateWorkExperience(formData, application.id).then((data) => {
        if (data?.success) {
          toast({
            title: data.success,
            variant: "success",
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

  let fileData = [];

  if (application.workExperience.length > 0) {
    application.workExperience.map((we) => {
      if (we.fileName && we.url) {
        fileData.push({
          id: we.id,
          name: we.fileName,
          url: we.url,
        });
      }
    });
  }

  return (
    <div className="mt-6 mb-4 rounded-lg border bg-white shadow-sm">
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
              form="work-experience-form"
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
        <Form {...form}>
          <form
            id="work-experience-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500">
                  Do you have any work experience?
                </p>
                {isEditing ? (
                  <div className="pt-1 grid gap-6 md:grid-cols-2">
                    <FormField
                      name="hasWorkExperience"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
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
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-gray-900 break-words">
                    {application.hasWorkExperience ? "Yes" : "No"}
                  </p>
                )}
              </div>
            </div>

            {form.watch("hasWorkExperience") === "yes" && (
              <div className="space-y-6">
                {fields.map((workExp, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-neutral-50/50 p-6 space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Job Title
                        </p>
                        {isEditing ? (
                          <FormField
                            name={`workExperience.${index}.title`}
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-sm font-medium text-neutral-900">
                            {workExp.title || "Not specified"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Name of Organisation
                        </p>
                        {isEditing ? (
                          <FormField
                            name={`workExperience.${index}.nameOfOrganisation`}
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-sm font-medium text-neutral-900">
                            {workExp.nameOfOrganisation || "Not specified"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Nature of Job
                        </p>
                        {isEditing ? (
                          <FormField
                            name={`workExperience.${index}.natureOfJob`}
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
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
                                      <SelectItem value="Full-Time">
                                        Full Time
                                      </SelectItem>
                                      <SelectItem value="Part-Time">
                                        Part Time
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-sm font-medium text-neutral-900">
                            {workExp.natureOfJob || "Not specified"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Job Start Date
                        </p>
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name={`workExperience.${index}.jobStartDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        disabled={isSaving}
                                      >
                                        {field.value ? (
                                          formatDateTime(new Date(field.value))
                                            .date
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
                        ) : (
                          <p className="text-sm font-medium text-neutral-900">
                            {workExp.jobStartDate
                              ? formatDate(workExp.jobStartDate)
                              : "Not specified"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Job End Date
                        </p>
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name={`workExperience.${index}.jobEndDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        disabled={isSaving}
                                      >
                                        {field.value ? (
                                          formatDateTime(new Date(field.value))
                                            .date
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
                                        disabled={(date) => {
                                          const jobStartDate = form.getValues(
                                            `workExperience.${index}.jobStartDate`
                                          );

                                          return (
                                            date < new Date(jobStartDate) ||
                                            date < new Date("1900-01-01")
                                          );
                                        }}
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
                        ) : (
                          <p className="text-sm font-medium text-neutral-900">
                            {workExp.jobEndDate
                              ? formatDate(workExp.jobEndDate)
                              : "Not specified"}
                          </p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-neutral-700">
                            Supporting Document
                          </p>
                          <FormField
                            control={form.control}
                            name={`workExperience.${index}.file`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <FileUploader
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    dropzoneOptions={dropzone}
                                    disabled={isSaving}
                                  >
                                    <FileInput>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="flex items-center gap-x-2"
                                      >
                                        <UploadIcon className="size-4" />
                                        Upload File
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
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="space-y-4">
                        {index > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="flex items-center gap-x-2"
                            disabled={isSaving}
                            onClick={() => remove(index)}
                          >
                            <TrashIcon className="size-4" />
                            Delete Work Experience
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isEditing && fields.length < 3 && (
                  <Button
                    type="button"
                    size="sm"
                    className="flex items-center gap-x-2"
                    disabled={isSaving}
                    onClick={() =>
                      append({
                        title: "",
                        nameOfOrganisation: "",
                        natureOfJob: "",
                        jobStartDate: "",
                        jobEndDate: "",
                      })
                    }
                  >
                    <PlusIcon className="size-4" />
                    Add Work Experience
                  </Button>
                )}
              </div>
            )}

            {fileData.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Uploaded Documents
                  </h3>
                </div>
                <FilesTable columns={fileColumns} data={fileData} />
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default WorkExperienceDetails;
