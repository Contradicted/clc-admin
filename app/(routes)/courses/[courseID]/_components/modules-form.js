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
  modules: z
    .array(
      z.object({
        code: z.string().min(1, "Module code is required"),
        title: z.string().min(1, "Module title is required"),
        credits: z.number().min(1, "Module credits is required"),
        assessment: z.array(
          z.object({
            type: z.string().min(1, "Assessment type is required"),
            percentage: z
              .number()
              .min(1, "Assessment percentage is required")
              .refine(
                (value) => {
                  const parsedPercentage = Number(value);
                  return (
                    !isNaN(parsedPercentage) &&
                    parsedPercentage >= 0 &&
                    parsedPercentage <= 100
                  );
                },
                {
                  message: "Please enter a valid percentage between 1 and 100",
                }
              ),
          })
        ),
        term: z.string().min(1, "Term is required"),
        type: z.string().min(1, "Type is required"),
      })
    )
    .min(1, "At least one module is required"),
});

const StudyModesTable = ({ data }) => {
  return (
    <table className="w-full">
      <tbody>
        {data.flatMap((m, mIndex) => [
          ...[
            // Spread the array of objects for each module
            { label: "Module Code", value: m.code },
            { label: "Title", value: m.title },
            { label: "Credits", value: m.credits },
            {
              label: "Assessment",
              value: m.assessment
                .split(", ")
                .map((item) => {
                  const [type, percentageStr] = item.split(" ");
                  return `${type}: ${percentageStr}`;
                })
                .join(", "),
            },
            { label: "Term", value: m.term },
            { label: "Type", value: m.type },
          ].map(({ label, value }, rowIndex) => (
            <tr key={`${mIndex}-${label}`} className="border border-stroke">
              <td className="font-semibold p-3 border border-r w-1/4">
                {label}:
              </td>
              <td className="px-3">{value}</td>
            </tr>
          )),
          // Add a spacer row after each study mode, except the last one
          ...(mIndex < data.length - 1
            ? [
                <tr key={`spacer-${mIndex}`} className="h-4">
                  <td colSpan="2"></td>
                </tr>,
              ]
            : []),
        ])}
      </tbody>
    </table>
  );
};

const ModulesForm = ({ initialData, courseID }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  console.log(initialData);

  const parseAssessmentString = (assessmentString) => {
    return assessmentString.split(", ").map((item) => {
      const [type, percentageStr] = item.split(" ");
      return {
        type,
        percentage: parseInt(percentageStr),
      };
    });
  };

  const form = useForm({
    defaultValues: {
      modules:
        initialData.length > 0
          ? initialData.map((module) => ({
              ...module,
              assessment: parseAssessmentString(module.assessment),
            }))
          : [
              {
                code: "",
                title: "",
                credits: null,
                assessment: [
                  {
                    type: "",
                    percentage: null,
                  },
                ],
                term: "",
                type: "",
              },
            ],
    },
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const router = useRouter();
  const { toast } = useToast();

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const addAssessment = (index) => {
    const assessments = form.getValues(`modules.${index}.assessment`) || [];
    form.setValue(`modules.${index}.assessment`, [
      ...assessments,
      {
        type: "",
        percentage: null,
      },
    ]);
  };

  const removeAssessment = (index, assessIndex) => {
    const assessments = form.getValues(`modules.${index}.assessment`) || [];
    form.setValue(`modules.${index}.assessment`, [
      ...assessments.filter((_, i) => i !== assessIndex),
    ]);
  };

  const onSubmit = (values) => {
    const formValues = form.getValues(`modules`);

    let isValid = true;
    let invalidModuleIndex = -1;

    formValues.forEach((module, index) => {
      console.log(`Module ${index + 1} assessments:`, module.assessment);
      const moduleTotal = module.assessment.reduce(
        (sum, assessment) => sum + Number(assessment.percentage),
        0
      );
      console.log(`Module ${index + 1} total:`, moduleTotal);

      if (Math.abs(moduleTotal - 100) > 0.01) {
        // Allow for small floating point errors
        isValid = false;
        invalidModuleIndex = index;
        return; // Exit the forEach loop early
      }
    });

    if (!isValid) {
      console.log(
        `Assessment percentages for Module ${invalidModuleIndex + 1} must add up to 100%`
      );
      return toast({
        variant: "destructive",
        title: `Assessment percentages for Module ${invalidModuleIndex + 1} must add up to 100%`,
      });
    }

    startTransition(() => {
      courses({ modules: formValues }, courseID)
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
          Course Modules
          <Button variant="ghost" className="gap-x-2" onClick={toggleEdit}>
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <PencilIcon className="size-4" />
                Edit Modules
              </>
            )}
          </Button>
        </div>
        {!isEditing && (
          <div
            className={cn(
              "text-sm mt-2 px-6.5 py-4",
              !initialData.length > 0 && "italic"
            )}
          >
            {initialData.some(Boolean) ? (
              <StudyModesTable data={initialData} />
            ) : (
              "No modules have been set"
            )}
          </div>
        )}
        {isEditing && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-6.5 py-4"
            >
              {fields.length < 6 && (
                <div className="flex items-center gap-x-2">
                  <Button
                    type="button"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() =>
                      append({
                        code: "",
                        title: "",
                        credits: "",
                        assessment: [{ type: "", percentage: "" }],
                        term: "",
                        type: "",
                      })
                    }
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
              )}
              {fields.map((item, index) => (
                <div key={item.id}>
                  <div className="mb-4.5 mt-4 flex flex-col gap-6 xl:flex-row">
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`modules.${index}.code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Module Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Eg. BSNC01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`modules.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Module Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Eg. Business Environment"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="mb-4.5 mt-4 flex flex-col gap-6 xl:flex-row">
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`modules.${index}.credits`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Module Credits</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                placeholder="Eg. 20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`modules.${index}.term`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Term</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a term" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Semester A">
                                  Semester A
                                </SelectItem>
                                <SelectItem value="Semester B">
                                  Semester B
                                </SelectItem>
                                <SelectItem value="Term 1">Term 1</SelectItem>
                                <SelectItem value="Term 2">Term 2</SelectItem>
                                <SelectItem value="Term 3">Term 3</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full xl:w-1/2">
                      <FormField
                        control={form.control}
                        name={`modules.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Compulsory">
                                  Compulsory
                                </SelectItem>
                                <SelectItem value="Optional">
                                  Optional
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {form
                    .watch(`modules.${index}.assessment`)
                    ?.map((assessment, assessIndex) => (
                      <div
                        key={assessIndex}
                        className="mb-4.5 mt-4 flex flex-col gap-6 xl:flex-row"
                      >
                        <div className="w-full xl:w-1/2">
                          <FormField
                            control={form.control}
                            name={`modules.${index}.assessment.${assessIndex}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assessment</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an assessment type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent position="top" sideOffset={5}>
                                    <SelectItem value="Exam">Exam</SelectItem>
                                    <SelectItem value="Coursework">
                                      Coursework
                                    </SelectItem>
                                    <SelectItem value="Practical">
                                      Practical
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="w-full xl:w-1/2">
                          <FormField
                            control={form.control}
                            name={`modules.${index}.assessment.${assessIndex}.percentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assessment Percentage</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    placeholder="Eg. 20%"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch(`modules.${index}.assessment`).length >
                          0 && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeAssessment(index, assessIndex)}
                            className="size-8 p-0 lg:mb-2 place-self-center"
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                  {form.watch(`modules.${index}.assessment`).length < 3 && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => addAssessment(index)}
                    >
                      Add Assessment
                    </Button>
                  )}

                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                      className="size-8 p-0 lg:my-4"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-x-2">
                <Button type="submit" disabled={isPending}>
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

export default ModulesForm;
