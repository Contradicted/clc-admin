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
    <div className="border-b border-stroke space-y-4 mt-4">
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

          <div className="flex gap-3 pb-4">
            <div className="flex items-start w-full max-w-[50%]">
              <p>Do you have any work experience?</p>
            </div>
            {isEditing ? (
              <FormField
                name="hasWorkExperience"
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
                {application.hasWorkExperience ? "Yes" : "No"}
              </p>
            )}
          </div>

          {form.watch("hasWorkExperience") === "yes" && (
            <div className="space-y-4 pb-4">
              {fields.map((workExp, index) => (
                <div
                  key={index}
                  className="w-full space-y-4 pb-4 bg-zinc-50 pt-3"
                >
                  <div className="flex gap-3">
                    <div className="flex items-center w-full max-w-[50%] pl-3">
                      <p>Job Title</p>
                    </div>
                    {isEditing && form.watch("hasWorkExperience") === "yes" ? (
                      <FormField
                        name={`workExperience.${index}.title`}
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="w-full mr-4">
                            <FormControl>
                              <Input {...field} disabled={isSaving} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="flex flex-wrap font-medium text-black w-full">
                        {workExp.title}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center w-full max-w-[50%] pl-3">
                      <p>Name of Organisation</p>
                    </div>
                    {isEditing && form.watch("hasWorkExperience") === "yes" ? (
                      <FormField
                        name={`workExperience.${index}.nameOfOrganisation`}
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="w-full mr-4">
                            <FormControl>
                              <Input {...field} disabled={isSaving} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="flex flex-wrap font-medium text-black w-full">
                        {workExp.nameOfOrganisation}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center w-full max-w-[50%] pl-3">
                      <p>Nature of Job</p>
                    </div>
                    {isEditing && form.watch("hasWorkExperience") === "yes" ? (
                      <FormField
                        name={`workExperience.${index}.natureOfJob`}
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="w-full mr-4">
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
                      <p className="flex flex-wrap font-medium text-black w-full">
                        {workExp.natureOfJob}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center w-full max-w-[50%] pl-3">
                      <p>Job Start Date</p>
                    </div>
                    {isEditing && form.watch("hasWorkExperience") === "yes" ? (
                      <FormField
                        control={form.control}
                        name={`workExperience.${index}.jobStartDate`}
                        render={({ field }) => (
                          <FormItem className="w-full mr-4">
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
                        {formatDate(workExp.jobStartDate)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center w-full max-w-[50%] pl-3">
                      <p>Job End Date</p>
                    </div>
                    {isEditing && form.watch("hasWorkExperience") === "yes" ? (
                      <FormField
                        control={form.control}
                        name={`workExperience.${index}.jobEndDate`}
                        render={({ field }) => (
                          <FormItem className="w-full mr-4">
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
                        {formatDate(workExp.jobEndDate)}
                      </p>
                    )}
                  </div>

                  {isEditing && (
                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.file`}
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {isEditing && index > 0 && (
                    <div className="pl-3">
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
                    </div>
                  )}
                </div>
              ))}

              {isEditing && fields.length < 3 && (
                <div className="flex items-center pb-4">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-x-2"
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
                </div>
              )}
            </div>
          )}

          {fileData.length > 0 && (
            <FilesTable columns={fileColumns} data={fileData} />
          )}
        </form>
      </Form>
    </div>
  );
};

export default WorkExperienceDetails;
