"use client";

import { courses } from "@/actions/courses";
import { DateTimePicker } from "@/components/date-time-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  cn,
  convertMonthsToYears,
  formatDate,
  formatStudyMode,
} from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PencilIcon, PlusIcon, PoundSterling, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  studyModes: z
    .array(
      z.object({
        study_mode: z.string(),
        duration: z.number().max(96, "Duration must be less than 96 months"),
        tuition_fees: z
          .number()
          .min(0, "Tuition fee must be a positive number")
          .max(100000, "Tuition fee must be less than £100,000")
          .refine(
            (value) => Number(value.toFixed(2)) === value,
            "Tuition fee cannot exceed two decimal places"
          ),
      })
    )
    .min(1, "At least one study mode is required")
    .max(2, "Maximum of two study modes allowed"),
});

const StudyModesTable = ({ data }) => {
  return (
    <table className="w-full">
      <tbody>
        {data.flatMap((sm, smIndex) => [
          ...[
            // Spread the array of objects for each study mode
            { label: "Study Mode", value: formatStudyMode(sm.study_mode) },
            { label: "Duration", value: `${sm.duration} months` },
            { label: "Tuition Fees", value: `£${sm.tuition_fees}` },
          ].map(({ label, value }, rowIndex) => (
            <tr key={`${smIndex}-${label}`} className="border border-stroke">
              <td className="font-semibold p-3 border border-r w-1/4">
                {label}:
              </td>
              <td className="px-3">
                {value}{" "}
                {label === "Duration" &&
                  (() => {
                    const numericValue = parseInt(value.match(/\d+/)[0]);
                    return numericValue >= 12 ? (
                      <span className="font-bold">
                        ({convertMonthsToYears(numericValue)})
                      </span>
                    ) : (
                      ""
                    );
                  })()}
              </td>
            </tr>
          )),
          // Add a spacer row after each study mode, except the last one
          ...(smIndex < data.length - 1
            ? [
                <tr key={`spacer-${smIndex}`} className="h-4">
                  <td colSpan="2"></td>
                </tr>,
              ]
            : []),
        ])}
      </tbody>
    </table>
  );
};

const StudyModeForm = ({ initialData, courseID }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      studyModes:
        initialData.length > 0
          ? initialData
          : [
              {
                study_mode: "",
                duration: "",
                tuition_fees: "",
              },
            ],
    },
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "studyModes",
  });

  const router = useRouter();
  const { toast } = useToast();

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const onSubmit = (values) => {
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
          Course Study Modes
          <Button variant="ghost" className="gap-x-2" onClick={toggleEdit}>
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <PencilIcon className="size-4" />
                Edit Study Modes
              </>
            )}
          </Button>
        </div>
        {!isEditing && (
          <p
            className={cn(
              "text-sm mt-2 px-6.5 py-4",
              !initialData.length > 0 && "italic"
            )}
          >
            {initialData.some(Boolean) ? (
              <StudyModesTable data={initialData} />
            ) : (
              "No study modes have been set"
            )}
          </p>
        )}
        {isEditing && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-6.5 py-4"
            >
              {fields.length < 2 && (
                <div className="flex items-center gap-x-2">
                  <Button
                    type="button"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() =>
                      append({ study_mode: "", duration: "", tuition_fees: "" })
                    }
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
              )}
              {fields.map((item, index) => (
                <div key={item.id}>
                  <FormField
                    control={form.control}
                    name={`studyModes.${index}.study_mode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Mode</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a study mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mb-4.5 mt-4 flex flex-col gap-6 xl:flex-row">
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`studyModes.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration of Course</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Eg. 6"
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the duration of the course in months.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`studyModes.${index}.tuition_fees`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tuition Fee</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center p-3 pointer-events-none border-r">
                                  <PoundSterling className="size-4" />
                                </div>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="Eg. £6250"
                                  className="pl-13"
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value));
                                  }}
                                />
                              </div>
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
                      variant="destructive"
                      onClick={() => remove(index)}
                      className="size-8 p-0 lg:mb-4"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
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

export default StudyModeForm;
