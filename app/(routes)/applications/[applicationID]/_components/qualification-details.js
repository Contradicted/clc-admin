"use client";

import {
  CalendarIcon,
  Loader2,
  PaperclipIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { fileColumns } from "@/components/columns";
import FilesTable from "@/components/files-table";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn, formatDate, formatDateTime } from "@/lib/utils";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import { updateQualifications } from "@/actions/update-application";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  qualifications: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, { message: "Title is required" }),
      examiningBody: z.string().min(1, { message: "Exam body is required" }),
      dateAwarded: z.date(),
      file: z.array(z.any()).optional(),
    })
  ),
  hasPendingResults: z.enum(["yes", "no"]),
  pendingQualifications: z
    .array(
      z.object({
        title: z.string().min(1, { message: "Title is required" }),
        examiningBody: z.string().min(1, { message: "Exam body is required" }),
        dateOfResults: z.date(),
        subjectsPassed: z
          .string()
          .min(1, { message: "Subjects passed is required" }),
      })
    )
    .optional()
    .refine(
      (data) => {
        if (data.hasPendingResults === "yes") {
          return (
            data.pendingQualifications &&
            data.pendingQualifications.length > 0 &&
            data.pendingQualifications.every(
              (qual) =>
                qual.title &&
                qual.examiningBody &&
                qual.dateOfResults &&
                qual.subjectsPassed
            )
          );
        }

        return true;
      },
      {
        message: "Enter pending qualification",
        path: ["pendingQualifications"],
      }
    ),
});

const QualificationDetails = ({ application }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const router = useRouter();
  const now = new Date();
  const { toast } = useToast();

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const form = useForm({
    defaultValues: {
      qualifications:
        application.qualifications.length > 0
          ? application.qualifications.map((qual) => ({
              ...qual,
              file: qual.url
                ? [{ name: qual.fileName, url: qual.url, alreadyExists: true }]
                : [],
            }))
          : [],
      hasPendingResults: application.hasPendingResults ? "yes" : "no",
      pendingQualifications: application.hasPendingResults
        ? application.pendingQualifications.length > 0
          ? application.pendingQualifications
          : []
        : undefined,
    },
    resolver: zodResolver(formSchema),
  });

  const watchHasPendingResults = form.watch("hasPendingResults");

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
    name: "qualifications",
  });

  const {
    fields: pendingQFields,
    append: appendPendingQ,
    remove: removePendingQ,
  } = useFieldArray({
    control: form.control,
    name: "pendingQualifications",
  });

  useEffect(() => {
    if (watchHasPendingResults === "yes" && pendingQFields.length === 0) {
      appendPendingQ({
        title: "",
        examiningBody: "",
        dateOfResults: "",
        subjectsPassed: "",
      });
    } else if (watchHasPendingResults === "no") {
      pendingQFields.forEach((_, index) => removePendingQ(index));
    }
  }, [
    watchHasPendingResults,
    pendingQFields,
    pendingQFields.length,
    appendPendingQ,
    removePendingQ,
  ]);

  const onSubmit = (values) => {
    const formData = new FormData();

    // Append qualifications
    values.qualifications.forEach((qual, index) => {
      formData.append(`qualifications[${index}][id]`, qual.id || "");
      formData.append(`qualifications[${index}][title]`, qual.title);
      formData.append(
        `qualifications[${index}][examiningBody]`,
        qual.examiningBody
      );
      formData.append(
        `qualifications[${index}][dateAwarded]`,
        qual.dateAwarded
      );

      // Handle file upload
      if (qual.file && qual.file.length > 0) {
        const file = qual.file[0];
        if (file instanceof File) {
          formData.append(`qualifications[${index}][file]`, file);
        } else if (file.alreadyExists) {
          formData.append(
            `qualifications[${index}][existingFile]`,
            JSON.stringify(file)
          );
        }
      }
    });

    // Append Pending Qualifications
    formData.append("hasPendingResults", values.hasPendingResults);

    if (values.hasPendingResults === "yes" && values.pendingQualifications) {
      values.pendingQualifications.forEach((qual, index) => {
        formData.append(`pendingQualifications[${index}][title]`, qual.title);
        formData.append(
          `pendingQualifications[${index}][examiningBody]`,
          qual.examiningBody
        );
        formData.append(
          `pendingQualifications[${index}][dateOfResults]`,
          qual.dateOfResults
        );
        formData.append(
          `pendingQualifications[${index}][subjectsPassed]`,
          qual.subjectsPassed
        );
      });
    }

    startTransition(() => {
      updateQualifications(formData, application.id).then((data) => {
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

  if (application.qualifications.length > 0) {
    application.qualifications.map((qual) => {
      if (qual.fileName && qual.url) {
        fileData.push({
          id: qual.id,
          name: qual.fileName,
          url: qual.url,
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

          {fields.map((qualification, index) => (
            <div key={index} className="w-full space-y-4 pb-4 bg-zinc-50 pt-3">
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%] pl-3">
                  <p>Qualification Title</p>
                </div>
                {isEditing ? (
                  <FormField
                    name={`qualifications.${index}.title`}
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
                    {qualification.title}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%] pl-3">
                  <p>Examining Body</p>
                </div>
                {isEditing ? (
                  <FormField
                    name={`qualifications.${index}.examiningBody`}
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
                    {qualification.examiningBody}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%] pl-3">
                  <p>Date Awarded</p>
                </div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name={`qualifications.${index}.dateAwarded`}
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
                    {formatDate(qualification.dateAwarded)}
                  </p>
                )}
              </div>

              {isEditing && (
                <FormField
                  control={form.control}
                  name={`qualifications.${index}.file`}
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
                    Delete Qualification
                  </Button>
                </div>
              )}
            </div>
          ))}

          {isEditing && fields.length < 3 && (
            <div className="flex items-center">
              <Button
                type="button"
                size="sm"
                className="gap-x-2"
                disabled={isSaving}
                onClick={() =>
                  append({
                    title: "",
                    examiningBody: "",
                    dateAwarded: "",
                  })
                }
              >
                <PlusIcon className="size-4" />
                Add Qualification
              </Button>
            </div>
          )}
          <div className="flex gap-3 pb-4">
            <div className="flex items-start w-full max-w-[50%]">
              <p>Do you have any pending qualifications?</p>
            </div>
            {isEditing ? (
              <FormField
                name="hasPendingResults"
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
                {application.hasPendingResults ? "Yes" : "No"}
              </p>
            )}
          </div>

          {form.watch("hasPendingResults") === "yes" && (
            <>
              {pendingQFields.map((qualification, index) => (
                <div
                  key={index}
                  className="w-full space-y-4 pb-4 bg-zinc-50 pt-3"
                >
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%] pl-3">
                      <p>Qualification Title</p>
                    </div>
                    {isEditing && form.watch("hasPendingResults") === "yes" ? (
                      <FormField
                        name={`pendingQualifications.${index}.title`}
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
                        {qualification.title}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%] pl-3">
                      <p>Examining Body</p>
                    </div>
                    {isEditing && form.watch("hasPendingResults") === "yes" ? (
                      <FormField
                        name={`pendingQualifications.${index}.examiningBody`}
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
                        {qualification.examiningBody}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%] pl-3">
                      <p>Date of Results</p>
                    </div>
                    {isEditing ? (
                      <FormField
                        control={form.control}
                        name={`pendingQualifications.${index}.dateOfResults`}
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
                                      date <= new Date() ||
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
                        {formatDate(qualification.dateAwarded)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-start w-full max-w-[50%] pl-3">
                      <p>Subjects Passed</p>
                    </div>
                    {isEditing && form.watch("hasPendingResults") === "yes" ? (
                      <FormField
                        name={`pendingQualifications.${index}.subjectsPassed`}
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
                        {qualification.subjectsPassed}
                      </p>
                    )}
                  </div>

                  {isEditing && index > 0 && (
                    <div className="pl-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-x-2"
                        disabled={isSaving}
                        onClick={() => removePendingQ(index)}
                      >
                        <TrashIcon className="size-4" />
                        Delete Pending Qualification
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isEditing && pendingQFields.length < 3 && (
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-x-2"
                    size="sm"
                    onClick={() =>
                      appendPendingQ({
                        title: "",
                        examiningBody: "",
                        dateOfResults: "",
                        subjectsPassed: "",
                      })
                    }
                    disabled={isSaving}
                  >
                    <PlusIcon className="size-4" />
                    Add Pending Qualification
                  </Button>
                </div>
              )}
            </>
          )}

          {fileData.length > 0 && (
            <FilesTable
              columns={fileColumns}
              data={fileData}
              className="mt-4"
            />
          )}
        </form>
      </Form>
    </div>
  );
};

export default QualificationDetails;
