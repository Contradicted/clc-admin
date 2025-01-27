"use client";

import {
  CalendarIcon,
  Loader2,
  PaperclipIcon,
  PencilIcon,
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
  FormLabel,
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
              form="qualification-details-form"
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
            {fields.map((qualification, index) => (
              <div
                key={index}
                className="rounded-lg border bg-neutral-50/50 p-6 space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-700">
                      Qualification Title
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {qualification.title || "Not specified"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-700">
                      Examining Body
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {qualification.examiningBody || "Not specified"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-700">
                      Date Awarded
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {qualification.dateAwarded
                        ? formatDate(qualification.dateAwarded)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                {index < fields.length - 1 && <div className="border-t my-6" />}
              </div>
            ))}

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Qualifications
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Do you have any pending qualifications?
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.hasPendingResults ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {application.hasPendingResults &&
              application.pendingQualifications.length > 0 && (
                <>
                  {application.pendingQualifications.map(
                    (qualification, index) => (
                      <div
                        key={index}
                        className="mt-3 rounded-lg border bg-neutral-50/50 p-6 space-y-6"
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-700">
                              Qualification Title
                            </p>
                            <p className="text-sm font-medium text-neutral-900">
                              {qualification.title || "Not specified"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-700">
                              Examining Body
                            </p>
                            <p className="text-sm font-medium text-neutral-900">
                              {qualification.examiningBody || "Not specified"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-700">
                              Date of Results
                            </p>
                            <p className="text-sm font-medium text-neutral-900">
                              {qualification.dateOfResults
                                ? formatDate(qualification.dateOfResults)
                                : "Not specified"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-700">
                              Subjects Passed
                            </p>
                            <p className="text-sm font-medium text-neutral-900">
                              {qualification.subjectsPassed || "Not specified"}
                            </p>
                          </div>
                        </div>
                        {index <
                          application.pendingQualifications.length - 1 && (
                          <div className="border-t my-6" />
                        )}
                      </div>
                    )
                  )}
                </>
              )}

            {fileData.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Uploaded Documents
                </h3>
                <FilesTable data={fileData} columns={fileColumns} />
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form
              id="qualification-details-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              {fields.map((qualification, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-neutral-50/50 p-6 space-y-6"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-700">
                        Qualification Title
                      </p>
                      <FormField
                        name={`qualifications.${index}.title`}
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
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-700">
                        Examining Body
                      </p>
                      <FormField
                        name={`qualifications.${index}.examiningBody`}
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
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-700">
                        Date Awarded
                      </p>
                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.dateAwarded`}
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
                    </div>
                  </div>

                  <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-700">
                        Supporting Document
                      </p>
                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.file`}
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
                      Delete Qualification
                    </Button>
                  )}
                </div>
              ))}

              {fields.length < 3 && (
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

              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Pending Qualifications
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      name="hasPendingResults"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Do you have any pending qualifications?
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
                </div>
              </div>

              {form.watch("hasPendingResults") === "yes" && (
                <>
                  {pendingQFields.map((qualification, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-neutral-50/50 p-6 space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-700">
                            Qualification Title
                          </p>
                          <FormField
                            name={`pendingQualifications.${index}.title`}
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
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-700">
                            Examining Body
                          </p>
                          <FormField
                            name={`pendingQualifications.${index}.examiningBody`}
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
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-700">
                            Date of Results
                          </p>
                          <FormField
                            control={form.control}
                            name={`pendingQualifications.${index}.dateOfResults`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground"
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
                                        disabled={(date) => date < new Date()}
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
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-700">
                            Subjects Passed
                          </p>
                          <FormField
                            name={`pendingQualifications.${index}.subjectsPassed`}
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
                        </div>
                      </div>

                      {index > 0 && (
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
                      )}
                    </div>
                  ))}

                  {pendingQFields.length < 3 && (
                    <div className="flex items-center">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-x-2"
                        disabled={isSaving}
                        onClick={() =>
                          appendPendingQ({
                            title: "",
                            examiningBody: "",
                            dateOfResults: "",
                            subjectsPassed: "",
                          })
                        }
                      >
                        <PlusIcon className="size-4" />
                        Add Pending Qualification
                      </Button>
                    </div>
                  )}
                </>
              )}

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

export default QualificationDetails;
