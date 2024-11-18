"use client";

import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import AmountInput from "@/components/amount-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  PaperclipIcon,
  Plus,
  UploadIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import FilesTable from "@/components/files-table";
import { fileColumns } from "@/components/columns";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { updatePaymentPlan } from "@/actions/update-application";

const expectedPaymentSchema = z.object({
  date: z.date({
    required_error: "Date is required",
    invalid_type_error: "That's not a valid date",
  }),
  amount: z.coerce
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0"),
  university: z.string().min(1, "University is required"),
  course: z.string().min(1, "Course is required"),
});

const formSchema = z
  .object({
    hasSlcAccount: z.enum(["Yes", "No"]).optional(),
    previouslyReceivedFunds: z.enum(["Yes", "No"]).optional(),
    previousFundingYear: z.string().optional(),
    appliedForCourse: z.enum(["Yes", "No"]).optional(),
    crn: z
      .string()
      .regex(/^\d{11}$/, "CRN must be exactly 11 digits")
      .transform((value) => (value === "" ? undefined : value))
      .optional()
      .or(z.literal("")),
    slcStatus: z
      .enum(
        [
          "Approved - Tuition Fees & Maintenance Loan",
          "Approved - Tuition Fees",
          "Approved - Maintenance Loan",
          "Rejected",
          "In-process",
        ],
        { required_error: "Status is required" }
      )
      .optional(),
    tuitionFeeAmount: z
      .union([
        z.string().min(0),
        z.number().positive("Amount must be greater than 0"),
      ])
      .transform((val) => {
        if (typeof val === "string" && val === "") return undefined;
        if (typeof val === "string") {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num;
        }
        return val;
      })
      .refine(
        (val) => {
          if (val === undefined) return true;
          const str = val.toString();
          const decimals = str.includes(".") ? str.split(".")[1].length : 0;
          return decimals <= 2;
        },
        {
          message: "Maximum of 2 decimal places allowed",
        }
      )
      .optional(),
    maintenanceLoanAmount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .or(z.undefined())
      .optional(),
    ssn: z
      .string()
      .regex(
        /^[A-Z]{4}\d{8}[A-Z]$/,
        "SSN must be 4 letters followed by 8 numbers and ending with a letter"
      )
      .optional()
      .or(z.literal("")),
    usingMaintenanceForTuition: z.boolean().or(z.literal("")).optional(),
    courseFee: z.number().optional(),
    expectedPayments: z.array(expectedPaymentSchema).optional(),
    tuition_doc: z.array(z.any()).optional(),
  })
  // .superRefine((data, ctx) => {
  //   // Only validate if user has SLC account
  //   if (data.hasSlcAccount !== "Yes") return;

  //   // Validate required fields for SLC account holders
  //   if (!data.previouslyReceivedFunds) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: "Please specify if you have previously received funds",
  //       path: ["previouslyReceivedFunds"],
  //     });
  //   }

  //   if (data.previouslyReceivedFunds === "Yes" && !data.previousFundingYear) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: "Please specify the year you received funding",
  //       path: ["previousFundingYear"],
  //     });
  //   }

  //   // Only continue validation if applied for course
  //   if (data.appliedForCourse !== "Yes") return;

  //   // Validate CRN and status
  //   if (!data.crn || !data.slcStatus) {
  //     !data.crn &&
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "Please enter your CRN",
  //         path: ["crn"],
  //       });
  //     !data.slcStatus &&
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "Please select the status of your application",
  //         path: ["slcStatus"],
  //       });
  //     return;
  //   }

  //   if (!data.slcStatus?.startsWith("Approved")) return;

  //   if (data.slcStatus?.startsWith("Approved")) {
  //     if (!data.ssn) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "SSN is required",
  //         path: ["ssn"],
  //       });
  //     }

  //     // Validate maintenance loan amount if status includes maintenance
  //     if (
  //       data.slcStatus.includes("Maintenance Loan") &&
  //       !data.maintenanceLoanAmount
  //     ) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "Maintenance loan amount is required",
  //         path: ["maintenanceLoanAmount"],
  //       });
  //     }

  //     // Skip payment validation for maintenance loan only
  //     if (data.slcStatus === "Approved - Maintenance Loan") return;

  //     if (!data.usingMaintenanceForTuition && data.tuitionFeeAmount) {
  //       const totalPayments =
  //         data.expectedPayments?.reduce(
  //           (sum, payment) => sum + (payment.amount || 0),
  //           0
  //         ) || 0;

  //       if (Math.abs(totalPayments - data.tuitionFeeAmount) > 0.01) {
  //         ctx.addIssue({
  //           code: z.ZodIssueCode.custom,
  //           message: `Total expected payments must equal the full tuition fee amount of ${formatCurrency(data.tuitionFeeAmount)}`,
  //           path: ["expectedPayments"],
  //         });
  //       }
  //     }

  //     // Validate required amounts based on approval type
  //     if (data.slcStatus.includes("Tuition Fees") && !data.tuitionFeeAmount) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "Tuition fee amount is required",
  //         path: ["tuitionFeeAmount"],
  //       });
  //     }

  //     if (
  //       data.slcStatus.includes("Maintenance Loan") &&
  //       !data.maintenanceLoanAmount
  //     ) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "Maintenance loan amount is required",
  //         path: ["maintenanceLoanAmount"],
  //       });
  //     }

  //     // Validate expected payments
  //     if (!data.expectedPayments?.length === 0) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "At least one expected payment is required",
  //         path: ["expectedPayments"],
  //       });
  //       return;
  //     }

  //     data.expectedPayments.forEach((payment, index) => {
  //       if (!payment.date) {
  //         ctx.addIssue({
  //           code: z.ZodIssueCode.custom,
  //           message: "Payment date is required",
  //           path: ["expectedPayments", index, "date"],
  //         });
  //       }
  //       if (!payment.amount) {
  //         ctx.addIssue({
  //           code: z.ZodIssueCode.custom,
  //           message: "Payment amount is required",
  //           path: ["expectedPayments", index, "amount"],
  //         });
  //       }
  //       if (!payment.university) {
  //         ctx.addIssue({
  //           code: z.ZodIssueCode.custom,
  //           message: "University is required",
  //           path: ["expectedPayments", index, "university"],
  //         });
  //       }
  //       if (!payment.course) {
  //         ctx.addIssue({
  //           code: z.ZodIssueCode.custom,
  //           message: "Course is required",
  //           path: ["expectedPayments", index, "course"],
  //         });
  //       }
  //     });

  //     // Validate payment totals
  //     const totalPayments = data.expectedPayments.reduce(
  //       (sum, payment) => sum + (payment.amount || 0),
  //       0
  //     );
  //     let expectedTotal = data.tuitionFeeAmount || 0;

  //     if (data.usingMaintenanceForTuition && data.courseFee) {
  //       expectedTotal = data.courseFee - data.tuitionFeeAmount;
  //     }

  //     if (Math.abs(totalPayments - expectedTotal) > 0.01) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: `Total expected payments must equal ${formatCurrency(expectedTotal)}`,
  //         path: ["expectedPayments"],
  //       });
  //     }
  //   }
  // })
  .superRefine((data, ctx) => {
    // Only validate if user has SLC account
    if (data.hasSlcAccount !== "Yes") return;

    // Validate required fields for SLC account holders
    if (!data.previouslyReceivedFunds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify if you have previously received funds",
        path: ["previouslyReceivedFunds"],
      });
    }

    if (data.previouslyReceivedFunds === "Yes" && !data.previousFundingYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify the year you received funding",
        path: ["previousFundingYear"],
      });
    }

    // Only continue validation if applied for course
    if (data.appliedForCourse !== "Yes") return;

    // Validate CRN and status
    if (!data.crn || !data.slcStatus) {
      !data.crn &&
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your CRN",
          path: ["crn"],
        });
      !data.slcStatus &&
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select the status of your application",
          path: ["slcStatus"],
        });
      return;
    }

    // Skip all other validations if not approved
    if (!data.slcStatus?.startsWith("Approved")) return;

    // From here, only validate if status is "Approved"
    if (data.slcStatus.includes("Tuition Fees")) {
      if (!data.tuitionFeeAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tuition fee amount is required",
          path: ["tuitionFeeAmount"],
        });
      }

      // Only validate payments for tuition fee cases
      if (!data.expectedPayments?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one expected payment is required",
          path: ["expectedPayments"],
        });
      } else {
        // Validate payment totals
        const totalPayments = data.expectedPayments.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        );
        const expectedTotal =
          data.usingMaintenanceForTuition && data.courseFee
            ? data.courseFee - data.tuitionFeeAmount
            : data.tuitionFeeAmount;

        if (Math.abs(totalPayments - expectedTotal) > 0.01) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Total expected payments must equal ${formatCurrency(expectedTotal)}`,
            path: ["expectedPayments"],
          });
        }
      }
    }

    if (
      data.slcStatus.includes("Maintenance Loan") &&
      !data.maintenanceLoanAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maintenance loan amount is required",
        path: ["maintenanceLoanAmount"],
      });
    }

    // Validate SSN for all approved statuses
    if (!data.ssn || data.ssn === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SSN is required",
        path: ["ssn"],
      });
    }
  });

export const StudentFinanceDetails = ({ application, courses }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const [shortFall, setShortFall] = useState(null);
  const [showMaintenanceOption, setShowMaintenanceOption] = useState(false);
  const [feeDifference, setFeeDifference] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [fileData, setFileData] = useState([]);

  const form = useForm({
    defaultValues: {
      paymentOption: application.paymentPlan?.paymentOption,
      hasSlcAccount: application.paymentPlan?.hasSlcAccount ? "Yes" : "No",
      previouslyReceivedFunds: application.paymentPlan?.previouslyReceivedFunds
        ? "Yes"
        : "No",
      previousFundingYear:
        application.paymentPlan?.previousFundingYear || undefined,
      appliedForCourse: application.paymentPlan?.appliedForCourse
        ? "Yes"
        : "No",
      crn: application.paymentPlan?.crn || "",
      courseFee: application.paymentPlan?.courseFee,
      slcStatus: application.paymentPlan?.slcStatus,
      tuitionFeeAmount: application.paymentPlan?.tuitionFeeAmount || undefined,
      maintenanceLoanAmount:
        application.paymentPlan?.maintenanceLoanAmount || undefined,
      ssn: application.paymentPlan?.ssn || "",
      usingMaintenanceForTuition:
        application.paymentPlan?.usingMaintenanceForTuition === true
          ? "Yes"
          : application.paymentPlan?.usingMaintenanceForTuition === false
            ? "No"
            : false,
      expectedPayments: application.paymentPlan?.expectedPayments || [],
      tuition_doc: application.tuition_doc_url
        ? [
            {
              name: application.tuition_doc_name,
              url: application.tuition_doc_url,
            },
          ]
        : [],
    },
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    name: "expectedPayments",
    control: form.control,
  });

  const now = new Date();
  const router = useRouter();
  const { toast } = useToast();

  const dropzone = {
    accept: {
      "application/msword": [".doc"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // Max 5MB
    maxFiles: 1,
    validator: (file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      // Only allow accepted file types
      if (!allowedTypes.includes(file.type)) {
        return {
          code: "file-invalid-type",
          message: "Invalid file type. Please try a different file",
        };
      }
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        return {
          code: "file-too-large",
          message: "File size must be less than 5MB",
        };
      }

      if (file.name.length > 100) {
        return {
          code: "file-name-long",
          message: "File name must be less than 100 characters",
        };
      }
      return null;
    },
  };

  const watchTuitionFeeAmount = form.watch("tuitionFeeAmount");
  const watchMaintenanceLoanAmount = form.watch("maintenanceLoanAmount");
  const watchSlcStatus = form.watch("slcStatus");
  const watchUsingMaintenanceForTuition = form.watch(
    "usingMaintenanceForTuition"
  );
  const watchExpectedPayments = form.watch("expectedPayments");

  const academicYears = Array.from({ length: 20 }, (_, i) => {
    const year = new Date().getFullYear() - i;

    return year;
  });

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const onSubmit = (values) => {
    console.log(values);

    let shortfall = null;
    const selectedCourseFee = application.paymentPlan?.courseFee || 0;
    const formData = new FormData();

    // Capture all data besides file and expected payments
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "tuition_doc" && key !== "expectedPayments") {
        formData.append(key, value);
      }
    });

    // Capture Shortfall if needed
    if (
      values.slcStatus === "Approved - Maintenance Loan" &&
      values.maintenanceLoanAmount &&
      selectedCourseFee &&
      values.maintenanceLoanAmount < selectedCourseFee
    ) {
      shortfall = {
        type: "maintenance",
        amount: selectedCourseFee - values.maintenanceLoanAmount,
        courseFee: selectedCourseFee,
        approvedAmount: values.maintenanceLoanAmount,
        status: values.slcStatus,
      };
    }

    if (
      [
        "Approved - Tuition Fees",
        "Approved - Tuition Fees & Maintenance Loan",
      ].includes(values.slcStatus) &&
      values.tuitionFeeAmount &&
      selectedCourseFee &&
      values.tuitionFeeAmount < selectedCourseFee &&
      !values.usingMaintenanceForTuition
    ) {
      shortfall = {
        type: "tuition",
        amount: selectedCourseFee - values.tuitionFeeAmount,
        courseFee: selectedCourseFee,
        approvedAmount: values.tuitionFeeAmount,
        status: values.slcStatus,
      };
    }

    // Capture JSON data
    formData.append(
      "expectedPayments",
      JSON.stringify(values.expectedPayments || [])
    );
    formData.append("shortfall", JSON.stringify(shortFall));
    formData.append(
      "paymentStatus",
      JSON.stringify({
        courseFee: application?.paymentPlan?.courseFee,
        totalAmount,
        insufficientTuition:
          shortfall?.type === "tuition" && !values.usingMaintenanceForTuition,
        insufficientMaintenance: shortfall?.type === "maintenance",
        difference: shortfall?.amount || 0,
      })
    );

    // Append file if present
    if (values.tuition_doc?.[0]) {
      if (values.tuition_doc[0] instanceof File) {
        formData.append("tuition_doc", values.tuition_doc[0]);
      } else if (values.tuition_doc[0].url) {
        formData.append(
          "tuition_doc_existing",
          JSON.stringify(values.tuition_doc[0])
        );
      }
    }

    startTransition(() => {
      updatePaymentPlan(formData, application.id).then((data) => {
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

  useEffect(() => {
    // Only run if we have both tuition fee and course fee
    if (!application.paymentPlan?.courseFee || !form.watch("tuitionFeeAmount"))
      return;

    const tuitionAmount = Number(form.watch("tuitionFeeAmount"));
    const maintenanceAmount = Number(form.watch("maintenanceLoanAmount"));
    const courseFee = Number(application.paymentPlan?.courseFee);

    // Calculate shortfall
    if (tuitionAmount < courseFee) {
      const difference = courseFee - tuitionAmount;
      setFeeDifference(difference);

      // Show maintenance option if:
      // 1. Status is "Approved - Tuition Fees & Maintenance Loan"
      // 2. Has maintenance loan amount
      // 3. Maintenance loan can cover the difference
      // 4. Not already using maintenance for tuition
      if (
        form.watch("slcStatus") ===
          "Approved - Tuition Fees & Maintenance Loan" &&
        maintenanceAmount &&
        maintenanceAmount >= difference &&
        !form.watch("usingMaintenanceForTuition") &&
        courseFee > 0
      ) {
        setShowMaintenanceOption(true);
      } else {
        setShowMaintenanceOption(false);
      }
    } else {
      setFeeDifference(null);
      setShowMaintenanceOption(false);
    }
  }, [
    watchTuitionFeeAmount,
    watchMaintenanceLoanAmount,
    watchSlcStatus,
    watchUsingMaintenanceForTuition,
    application.paymentPlan?.courseFee,
  ]);

  useEffect(() => {
    const payments = form.watch("expectedPayments") || [];
    const total = payments.reduce((sum, payment) => {
      return sum + (payment?.amount ? Number(payment.amount) : 0);
    }, 0);
    setTotalAmount(Number(total.toFixed(2)));
  }, [watchExpectedPayments]);

  useEffect(() => {
    if (
      Math.abs(
        totalAmount -
          (form.watch("usingMaintenanceForTuition")
            ? application.paymentPlan?.courseFee -
              (form.watch("tuitionFeeAmount") || 0)
            : form.watch("tuitionFeeAmount") || 0)
      ) <= 0.01
    ) {
      form.clearErrors("expectedPayments");
    }
  }, [
    totalAmount,
    form.watch("tuitionFeeAmount"),
    form.watch("usingMaintenanceForTuition"),
  ]);

  useEffect(() => {
    const tuitionFeeAmount = Number(form.watch("tuitionFeeAmount"));
    const courseFee = Number(application.paymentPlan?.courseFee) || 0;
    const maintenanceLoanAmount =
      Number(form.watch("maintenanceLoanAmount")) || 0;
    const currentStatus = form.watch("slcStatus");

    // Only calculate shortfall if there's a tuition fee amount
    if (courseFee && !isNaN(tuitionFeeAmount) && tuitionFeeAmount > 0) {
      const difference = courseFee - tuitionFeeAmount;

      if (difference > 0) {
        setShortFall(difference);

        // Show maintenance option only if:
        // 1. Approved for both tuition and maintenance
        // 2. Has enough maintenance to cover the shortfall
        const canUseMaintenanceLoan =
          currentStatus === "Approved - Tuition Fees & Maintenance Loan" &&
          maintenanceLoanAmount >= difference;

        setShowMaintenanceOption(canUseMaintenanceLoan);
      } else {
        setShortFall(null);
        setShowMaintenanceOption(false);
      }
    } else {
      // Reset both states if no valid tuition fee amount
      setShortFall(null);
      setShowMaintenanceOption(false);
    }
  }, [
    form.watch("tuitionFeeAmount"),
    form.watch("maintenanceLoanAmount"),
    form.watch("slcStatus"),
    application.paymentPlan?.courseFee,
  ]);

  // Update fileData array with file
  useEffect(() => {
    if (!application.tuition_doc_url || !application.tuition_doc_name) return;

    setFileData([
      {
        name: application.tuition_doc_name,
        url: application.tuition_doc_url,
      },
    ]);
  }, [application.tuition_doc_url, application.tuition_doc_name]);

  console.log(form.formState.errors);
  console.log(fileData);

  return (
    <div className="w-full border-b border-stroke space-y-4 my-5">
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
              <Button onClick={() => setIsEditing(!isEditing)}>Edit</Button>
            )}
          </div>

          <div className="w-full space-y-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:gap-3">
              <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                Payment Option
              </div>
              {isEditing ? (
                <FormField
                  name="paymentOption"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger disabled>
                            <SelectValue placeholder="Select a payment option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Parents">Parents</SelectItem>
                          <SelectItem value="Family_Members">
                            Family Members
                          </SelectItem>
                          <SelectItem value="Employers">Employers</SelectItem>
                          <SelectItem value="Self">Self</SelectItem>
                          <SelectItem value="SLC">SLC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                  {application.paymentPlan?.paymentOption || "-"}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-3">
              <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                Do you have an account with the Student Loan Company (SLC)?
              </div>
              {isEditing ? (
                <FormField
                  name="hasSlcAccount"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);

                          if (value === "No") {
                            form.reset({
                              ...form.getValues(),
                              previouslyReceivedFunds: undefined,
                              previousFundingYear: undefined,
                              appliedForCourse: undefined,
                              crn: "",
                              slcStatus: undefined,
                              tuitionFeeAmount: "",
                              maintenanceLoanAmount: undefined,
                              ssn: "",
                              expectedPayments: [],
                            });
                          }
                        }}
                        defaultValue={field.value}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                  {application.paymentPlan?.hasSlcAccount ? "Yes" : "No" || "-"}
                </p>
              )}
            </div>

            {form.watch("hasSlcAccount") === "Yes" && (
              <>
                <div className="flex flex-col sm:flex-row sm:gap-3">
                  <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                    Have you previously received funds from SLC?
                  </div>
                  {isEditing ? (
                    <FormField
                      name="previouslyReceivedFunds"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);

                              if (value === "No") {
                                form.setValue("previousFundingYear", undefined);
                              }
                            }}
                            defaultValue={field.value}
                            disabled={isSaving}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                      {application.paymentPlan?.previouslyReceivedFunds
                        ? "Yes"
                        : "No" || "-"}
                    </p>
                  )}
                </div>

                {form.watch("previouslyReceivedFunds") === "Yes" && (
                  <div className="flex flex-col sm:flex-row sm:gap-3">
                    <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                      During which academic year did you receive funding?
                    </div>
                    {isEditing ? (
                      <FormField
                        name="previousFundingYear"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isSaving}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an academic year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent position="top">
                                {academicYears.map((year) => (
                                  <SelectItem
                                    key={year}
                                    value={`${year - 1}/${year}`}
                                  >
                                    {year - 1}/{year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                        {application.paymentPlan?.previousFundingYear || "-"}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:gap-3">
                  <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                    Have you applied for SLC funding for this course?
                  </div>
                  {isEditing ? (
                    <FormField
                      name="appliedForCourse"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);

                              if (value === "No") {
                                form.reset({
                                  ...form.getValues(),
                                  crn: "",
                                  slcStatus: undefined,
                                  tuitionFeeAmount: undefined,
                                  maintenanceLoanAmount: undefined,
                                  ssn: "",
                                  expectedPayments: [],
                                });
                              }
                            }}
                            defaultValue={field.value}
                            disabled={isSaving}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                      {application.paymentPlan?.appliedForCourse
                        ? "Yes"
                        : "No" || "-"}
                    </p>
                  )}
                </div>
              </>
            )}

            {form.watch("appliedForCourse") === "Yes" && (
              <>
                <div className="flex flex-col sm:flex-row sm:gap-3">
                  <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                    Customer Reference Number (CRN)
                  </div>
                  {isEditing ? (
                    <FormField
                      name="crn"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your 11-digit CRN"
                              disabled={isSaving}
                              maxLength={11}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                      {application.paymentPlan?.crn || "-"}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:gap-3">
                  <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                    What is the status of your application?
                  </div>
                  {isEditing ? (
                    <FormField
                      name="slcStatus"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);

                              form.reset({
                                ...form.getValues(),
                                tuitionFeeAmount: undefined,
                                maintenanceLoanAmount: undefined,
                                ssn: "",
                                expectedPayments: [],
                                usingMaintenanceForTuition: false,
                              });
                            }}
                            defaultValue={field.value}
                            disabled={isSaving}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent position="top">
                              <SelectItem value="Approved - Tuition Fees & Maintenance Loan">
                                Approved - Tuition Fees & Maintenance Loan
                              </SelectItem>
                              <SelectItem value="Approved - Tuition Fees">
                                Approved - Tuition Fees
                              </SelectItem>
                              <SelectItem value="Approved - Maintenance Loan">
                                Approved - Maintenance Loan
                              </SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                              <SelectItem value="In-process">
                                In-process
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                      {application.paymentPlan?.slcStatus || "-"}
                    </p>
                  )}
                </div>

                {form.watch("slcStatus")?.startsWith("Approved") && (
                  <div className="space-y-6">
                    {(form.watch("slcStatus") ===
                      "Approved - Tuition Fees & Maintenance Loan" ||
                      form.watch("slcStatus") ===
                        "Approved - Tuition Fees") && (
                      <div className="flex flex-col sm:flex-row sm:flex-wrap">
                        <div className="flex sm:flex-row w-full sm:gap-3">
                          <div className="flex items-start w-full text-sm sm:text-base">
                            Tuition Fee Amount
                          </div>
                          {isEditing ? (
                            <div className="w-full space-y-4">
                              <FormField
                                name="tuitionFeeAmount"
                                control={form.control}
                                render={({ field }) => (
                                  <FormItem className="w-full">
                                    <FormControl>
                                      <AmountInput
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(value) => {
                                          field.onChange(
                                            value === "" ? "" : value
                                          );
                                          form.setValue(
                                            "usingMaintenanceForTuition",
                                            false
                                          );
                                        }}
                                        disabled={isSaving}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : (
                            <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                              {application.paymentPlan?.tuitionFeeAmount
                                ? formatCurrency(
                                    application.paymentPlan.tuitionFeeAmount
                                  )
                                : "-"}
                            </p>
                          )}
                        </div>

                        {isEditing &&
                          shortFall &&
                          form.watch("tuitionFeeAmount") && (
                            <div className="mt-4.5 block w-full p-4 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>Administrative Review Required:</strong>{" "}
                                The SLC tuition fee amount (
                                {formatCurrency(form.watch("tuitionFeeAmount"))}
                                ) is less than the course fee (
                                {formatCurrency(
                                  application.paymentPlan?.courseFee
                                )}
                                ).
                                {showMaintenanceOption ? (
                                  <span>
                                    {" "}
                                    You may use your maintenance loan to cover
                                    the difference of{" "}
                                    {formatCurrency(shortFall)}.
                                  </span>
                                ) : (
                                  <span>
                                    {" "}
                                    This application will be under
                                    administrative review.
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                      </div>
                    )}

                    {(form.watch("slcStatus") ===
                      "Approved - Tuition Fees & Maintenance Loan" ||
                      form.watch("slcStatus") ===
                        "Approved - Maintenance Loan") && (
                      <div className="flex flex-col sm:flex-row sm:gap-3">
                        <div className="flex items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                          Maintenance Loan Amount
                        </div>
                        {isEditing ? (
                          <FormField
                            name="maintenanceLoanAmount"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormControl>
                                  <AmountInput
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(value) => {
                                      field.onChange(value === "" ? "" : value);
                                    }}
                                    disabled={isSaving}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                            {application.paymentPlan?.maintenanceLoanAmount
                              ? formatCurrency(
                                  application.paymentPlan.maintenanceLoanAmount
                                )
                              : "-"}
                          </p>
                        )}
                      </div>
                    )}

                    {showMaintenanceOption && (
                      <div className="mt-4 p-4 bg-neutral-100 rounded-md space-y-4">
                        <p className="text-sm font-medium">
                          Would you like to use your maintenance loan to cover
                          the remaining tuition fee of{" "}
                          {formatCurrency(feeDifference)}?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={isSaving}
                            onClick={() => {
                              if (!feeDifference) return;

                              // Create two equal payments from the difference
                              const paymentAmount = Number(
                                (feeDifference / 2).toFixed(2)
                              );
                              const payments = [
                                {
                                  date: new Date(),
                                  amount: paymentAmount,
                                  university: "Plymouth Marjon University",
                                  course: application.courseTitle,
                                },
                                {
                                  date: new Date(),
                                  amount: feeDifference - paymentAmount, // Handle any rounding
                                  university: "Plymouth Marjon University",
                                  course: application.courseTitle,
                                },
                              ];

                              // Update form
                              form.setValue("expectedPayments", payments);
                              form.setValue("usingMaintenanceForTuition", true);
                              setShowMaintenanceOption(false);
                            }}
                          >
                            Yes, use maintenance loan
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={isSaving}
                            onClick={() => setShowMaintenanceOption(false)}
                          >
                            No, I&apos;ll pay another way
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:gap-3">
                      <div className="flex flex-col items-start w-full sm:max-w-[50%] text-sm sm:text-base">
                        Student Support Number (SSN)
                        <span className="text-muted-foreground text-xs">
                          (4 letters, 8 numbers, 1 letter)
                        </span>
                      </div>
                      {isEditing ? (
                        <FormField
                          name="ssn"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isSaving}
                                  maxLength={13}
                                  className="uppercase"
                                  onChange={(e) => {
                                    // Convert to uppercase and remove spaces
                                    const value = e.target.value
                                      .toUpperCase()
                                      .replace(/\s/g, "");
                                    field.onChange(value);
                                  }}
                                  placeholder="e.g., ABCD12345678E"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <p className="flex flex-wrap font-medium text-black w-full mt-1 sm:mt-0">
                          {application.paymentPlan?.ssn || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Replace the existing expected payments section */}
            {form.watch("slcStatus")?.startsWith("Approved") &&
              form.watch("slcStatus") !== "Approved - Maintenance Loan" && (
                <div className="mt-6">
                  <h3 className="mb-4 text-sm sm:text-base">
                    Expected Payments
                  </h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4">
                          <div className="items-center md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                            <FormField
                              name={`expectedPayments.${index}.date`}
                              control={form.control}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only md:not-sr-only">
                                    Date
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          disabled={isSaving}
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
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
                                          date > new Date("2100-01-01")
                                        }
                                        initialFocus
                                        weekStartsOn={1}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              name={`expectedPayments.${index}.amount`}
                              control={form.control}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only md:not-sr-only">
                                    Amount
                                  </FormLabel>
                                  <FormControl>
                                    <AmountInput
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(value) => {
                                        field.onChange(value);

                                        // Recalculate total
                                        const payments =
                                          form.getValues("expectedPayments") ||
                                          [];
                                        const total = payments.reduce(
                                          (sum, payment) => {
                                            return (
                                              Number(sum) +
                                              Number(payment?.amount || 0)
                                            );
                                          },
                                          0
                                        );
                                        setTotalAmount(total);
                                      }}
                                      disabled={isSaving}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`expectedPayments.${index}.university`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only md:not-sr-only">
                                    University or College
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isSaving}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select university or college" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Plymouth Marjon University">
                                        Plymouth Marjon University
                                      </SelectItem>
                                      <SelectItem value="Gloucestershire College">
                                        Gloucestershire College
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`expectedPayments.${index}.course`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="sr-only md:not-sr-only">
                                    Course
                                  </FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // handleCourseSelection(value);
                                    }}
                                    value={field.value}
                                    disabled={isSaving}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select your course" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {courses.map((course) => (
                                        <SelectItem
                                          className="w-full"
                                          key={course.id}
                                          value={course.name}
                                        >
                                          {course.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={isSaving}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            date: new Date(),
                            amount: "",
                            university: "Plymouth Marjon University",
                            course: application.courseTitle,
                          })
                        }
                        disabled={isSaving}
                        className="w-full md:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment
                      </Button>

                      {isEditing &&
                        form.watch("slcStatus") !==
                          "Approved - Maintenance Loan" && (
                          <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">
                                  Course Fee
                                </div>
                                <div className="font-medium">
                                  {formatCurrency(
                                    application.paymentPlan?.courseFee
                                  )}
                                </div>
                              </div>

                              {form.watch("usingMaintenanceForTuition") ? (
                                <>
                                  <div>
                                    <div className="text-muted-foreground">
                                      SLC Tuition Fee Amount
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(
                                        form.watch("tuitionFeeAmount") || 0
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">
                                      Remaining to Pay
                                    </div>
                                    <div className="font-medium">
                                      {formatCurrency(
                                        application.paymentPlan?.courseFee -
                                          (form.watch("tuitionFeeAmount") || 0)
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <div className="text-muted-foreground">
                                    Required Payment Amount
                                  </div>
                                  <div className="font-medium">
                                    {formatCurrency(
                                      form.watch("tuitionFeeAmount") || 0
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <div className="text-muted-foreground">
                                  Total Expected Payments
                                </div>
                                <div
                                  className={cn(
                                    "font-medium",
                                    form.watch("tuitionFeeAmount")
                                      ? Math.abs(
                                          totalAmount -
                                            (form.watch(
                                              "usingMaintenanceForTuition"
                                            )
                                              ? application.paymentPlan
                                                  ?.courseFee -
                                                (form.watch(
                                                  "tuitionFeeAmount"
                                                ) || 0)
                                              : form.watch(
                                                  "tuitionFeeAmount"
                                                ) || 0)
                                        ) <= 0.01
                                        ? "text-green-600"
                                        : "text-destructive"
                                      : ""
                                  )}
                                >
                                  {formatCurrency(totalAmount)}
                                </div>
                              </div>
                            </div>

                            {form.formState.errors.expectedPayments && (
                              <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                                {form.formState.errors.expectedPayments.message}
                              </p>
                            )}

                            {form.formState.errors.expectedPayments?.root
                              ?.message && (
                              <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                                {
                                  form.formState.errors.expectedPayments.root
                                    .message
                                }
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">
                                Date
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Amount
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                University
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Course
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {application.paymentPlan?.expectedPayments?.length >
                            0 ? (
                              application.paymentPlan.expectedPayments.map(
                                (payment, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="whitespace-nowrap">
                                      {new Date(
                                        payment.date
                                      ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell>{payment.university}</TableCell>
                                    <TableCell>{payment.course}</TableCell>
                                  </TableRow>
                                )
                              )
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="h-24 text-center text-sm italic text-muted-foreground"
                                >
                                  No payments have been set
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

            <div className="flex gap-3">
              {isEditing && (
                <FormField
                  name="tuition_doc"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
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
                            Upload Tuition Document
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
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
          {fileData.length > 0 && (
            <FilesTable data={fileData} columns={fileColumns} />
          )}
        </form>
      </Form>
    </div>
  );
};
