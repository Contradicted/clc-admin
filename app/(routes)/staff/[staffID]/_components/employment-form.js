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
import {
  CalendarIcon,
  Loader2,
  Paperclip,
  Pencil,
  PlusIcon,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { departments } from "@/constants";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import FilesTable from "@/components/files-table";
import { employmentFileColumns } from "@/components/columns";
import { useEditing } from "@/providers/editing-provider";

nationalities.registerLocale(nationalitiesEnglish);

const formSchema = z.object({
  employment: z.array(
    z
      .object({
        job_title: z.string().min(1, { message: "Job Title is required" }),
        department: z.string().min(1, { message: "Department is required" }),
        nameOfOrg: z
          .string()
          .min(1, { message: "Name of Organisation is required" }),
        type: z.string().min(1, { message: "Type is required" }),
        start_date: z
          .date({
            required_error: "Start date is required",
          })
          .refine(
            (date) => {
              return date < new Date(Date.now());
            },
            {
              message: "The date must be before today",
            }
          ),
        end_date: z
          .date({
            required_error: "End date is required",
          })
          .refine(
            (date) => {
              return date < new Date(Date.now());
            },
            {
              message: "The date must be before today",
            }
          ),
        files: z.array(z.any()).optional(),
      })
      .superRefine((data, ctx) => {
        if (data.end_date && data.end_date < data.start_date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be after start date",
            path: ["end_date"],
          });
        }
      })
  ),
});

const EmploymentForm = ({ initialData, staffID }) => {
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [files, setFiles] = useState([]);

  const { isEditing, setIsEditing } = useEditing();

  const router = useRouter();
  const { toast } = useToast();
  const now = new Date();

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

  const form = useForm({
    defaultValues: {
      employment:
        initialData.length > 0
          ? initialData.map((emp) => ({
              id: emp.id,
              ...emp,
              files: emp.doc_url
                ? [{ name: emp.doc_name, url: emp.doc_url }]
                : [],
            }))
          : [
              {
                job_title: "",
                department: "",
                nameOfOrg: "",
                start_date: "",
                end_date: "",
                type: "",
                files: [],
              },
            ],
    },
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    name: "employment",
    control: form.control,
  });

  useEffect(() => {
    if (
      initialData.length > 0 &&
      initialData.some((emp) => emp.doc_url) &&
      !files.length > 0
    ) {
      setFiles(
        initialData.map((emp) => ({ name: emp.doc_name, url: emp.doc_url }))
      );
    }
  }, [initialData, files]);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setIsFormEditing(!isFormEditing);
  };

  const handleFileChange = (index, files) => {
    const updatedEmployment = form.getValues("employment");
    updatedEmployment[index].files = files;
    form.setValue("employment", updatedEmployment, { shouldValidate: true });
  };

  const onSubmit = () => {
    const formData = new FormData();

    form.getValues("employment").forEach((emp, index) => {
      Object.keys(emp).forEach((key) => {
        if (key === "id" && emp.id) {
          formData.append(`employment[${index}][id]`, emp.id);
        } else if (key === "files") {
          if (emp.files && emp.files.length > 0) {
            emp.files.forEach((file, fileIndex) => {
              if (file instanceof File) {
                formData.append(
                  `employment[${index}][files][${fileIndex}]`,
                  file
                );
              } else {
                formData.append(`employment[${index}][existingFile]`, file.url);
              }
            });
          } else if (emp.id) {
            // If there's an ID but no files, it means the file was deleted
            formData.append(`employment[${index}][deleteFile]`, "true");
          }
        } else {
          formData.append(`employment[${index}][${key}]`, emp[key]);
        }
      });
    });

    startTransition(() => {
      staff(formData, staffID)
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
                Employment History
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
              <>
                {fields.length < 5 && (
                  <div className="flex items-center gap-x-2">
                    <Button
                      type="button"
                      size="sm"
                      className="size-8 p-0"
                      disabled={isSaving}
                      onClick={() =>
                        append({
                          job_title: "",
                          department: "",
                          start_date: "",
                          end_date: "",
                          status: "",
                        })
                      }
                    >
                      <PlusIcon className="size-4" />
                    </Button>
                  </div>
                )}
                {fields.map((item, index) => (
                  <div
                    className="w-full mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-3"
                    key={item.id}
                  >
                    <FormField
                      control={form.control}
                      name={`employment.${index}.job_title`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Eg. Administrator"
                              className={
                                form.formState.errors.job_title && "border-red"
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
                      name={`employment.${index}.department`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className={
                                form.formState.errors.department && "border-red"
                              }
                              disabled={isSaving}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent position="top">
                                {departments.map((dept, index) => (
                                  <SelectItem key={index} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`employment.${index}.nameOfOrg`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Name of Organisation</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Eg. ABC Company"
                              className={
                                form.formState.errors.nameOfOrg && "border-red"
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
                      name={`employment.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className={
                                form.formState.errors.type && "border-red"
                              }
                              disabled={isSaving}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent position="top">
                                <SelectItem value="Full Time">
                                  Full Time
                                </SelectItem>
                                <SelectItem value="Part Time">
                                  Part Time
                                </SelectItem>
                                <SelectItem value="Contract">
                                  Contract
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`employment.${index}.start_date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal rounded-[10px] px-[25px]",
                                    !field.value && "text-muted-foreground",
                                    form.formState.errors.start_date &&
                                      "border-red"
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
                      name={`employment.${index}.end_date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal rounded-[10px] px-[25px]",
                                    !field.value && "text-muted-foreground",
                                    form.formState.errors.end_date &&
                                      "border-red"
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
                      name={`employment.${index}.files`}
                      render={({ field }) => (
                        <FormItem className="col-span-full">
                          <FileUploader
                            value={field.value}
                            onValueChange={(files) =>
                              handleFileChange(index, files)
                            }
                            dropzoneOptions={dropzone}
                            disabled={isSaving}
                          >
                            <FileInput>
                              <Button type="button" disabled={isSaving}>
                                Upload File
                              </Button>
                            </FileInput>
                            {field.value && field.value.length > 0 && (
                              <FileUploaderContent disabled={isSaving}>
                                {field.value.map((file, i) => (
                                  <FileUploaderItem key={i} index={i}>
                                    <Paperclip className="h-4 w-4 stroke-current" />
                                    <span>{file.name}</span>
                                  </FileUploaderItem>
                                ))}
                              </FileUploaderContent>
                            )}
                          </FileUploader>
                        </FormItem>
                      )}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(index)}
                        className="size-8 p-0 self-end"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}
            {!isFormEditing && (
              <div
                className={cn(
                  "text-sm mt-4",
                  !initialData.length > 0 && "italic"
                )}
              >
                {initialData.some(Boolean) ? (
                  <>
                    {initialData.map((employment, index) => (
                      <div
                        className="mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-4"
                        key={index}
                      >
                        <div className="flex flex-col gap-y-2 break-words">
                          <p className="text-sm text-zinc-400 font-medium">
                            Job Title
                          </p>
                          <span className="text-sm font-medium text-graydark">
                            {employment.job_title}
                          </span>
                        </div>
                        <div className="flex flex-col gap-y-2 break-words">
                          <p className="text-sm text-zinc-400 font-medium">
                            Department
                          </p>
                          <span className="text-sm font-medium text-graydark">
                            {employment.department}
                          </span>
                        </div>
                        <div className="flex flex-col gap-y-2 break-words">
                          <p className="text-sm text-zinc-400 font-medium">
                            Organisation
                          </p>
                          <span className="text-sm font-medium text-graydark">
                            {employment.nameOfOrg || "-"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-y-2 break-words">
                          <p className="text-sm text-zinc-400 font-medium">
                            Type
                          </p>
                          <span className="text-sm font-medium text-graydark">
                            {employment.type || "-"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-y-2 break-words">
                          <p className="text-sm text-zinc-400 font-medium">
                            Start Date
                          </p>
                          <span className="text-sm font-medium text-graydark">
                            {formatDateTime(employment.start_date).date || "-"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-y-2 break-words">
                          <p className="text-sm text-zinc-400 font-medium">
                            End Date
                          </p>
                          <span className="text-sm font-medium text-graydark">
                            {formatDateTime(employment.end_date).date || "-"}
                          </span>
                        </div>

                        {files && files.length > 0 && (
                          <FilesTable
                            data={files}
                            columns={employmentFileColumns()}
                            className="col-span-full mt-2"
                          />
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  "No employment information has been set"
                )}
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EmploymentForm;
