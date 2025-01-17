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
  PencilIcon,
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
  date: z.coerce.date({
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
    file: z.array(z.any()).optional(),
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

  //   if (data.slcStatus.includes("Tuition Fees")) {
  //     if (!data.tuitionFeeAmount) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "Tuition fee amount is required",
  //         path: ["tuitionFeeAmount"],
  //       });
  //     }

  //     // Only validate payments for tuition fee cases
  //     if (!data.expectedPayments?.length) {
  //       ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         message: "At least one expected payment is required",
  //         path: ["expectedPayments"],
  //       });
  //     } else {
  //       // Validate payment totals
  //       const totalPayments = data.expectedPayments.reduce(
  //         (sum, payment) => sum + (payment.amount || 0),
  //         0
  //       );
  //       const expectedTotal =
  //         data.usingMaintenanceForTuition && data.courseFee
  //           ? data.courseFee - data.tuitionFeeAmount
  //           : data.tuitionFeeAmount;

  //       if (Math.abs(totalPayments - expectedTotal) > 0.01) {
  //         ctx.addIssue({
  //           code: z.ZodIssueCode.custom,
  //           message: `Total expected payments must equal ${formatCurrency(expectedTotal)}`,
  //           path: ["expectedPayments"],
  //         });
  //       }
  //     }
  //   }

  //   if (
  //     data.slcStatus.includes("Maintenance Loan") &&
  //     !data.maintenanceLoanAmount
  //   ) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: "Maintenance loan amount is required",
  //       path: ["maintenanceLoanAmount"],
  //     });
  //   }

  //   // Validate SSN for all approved statuses
  //   if (!data.ssn || data.ssn === "") {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: "SSN is required",
  //       path: ["ssn"],
  //     });
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

const StudentFinanceDetails = ({ application, courses }) => {
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
      hasSlcAccount:
        application.paymentPlan?.hasSlcAccount === true
          ? "Yes"
          : application.paymentPlan?.hasSlcAccount === false
            ? "No"
            : undefined,
      previouslyReceivedFunds:
        application.paymentPlan?.previouslyReceivedFunds === true
          ? "Yes"
          : application.paymentPlan?.previouslyReceivedFunds === false
            ? "No"
            : undefined,
      previousFundingYear:
        application.paymentPlan?.previousFundingYear || undefined,
      appliedForCourse:
        application.paymentPlan?.appliedForCourse === true
          ? "Yes"
          : application.paymentPlan?.appliedForCourse === false
            ? "No"
            : undefined,
      crn: application.paymentPlan?.crn || "",
      courseFee:
        application.paymentPlan?.courseFee ||
        courses
          ?.find((course) => course.id === application.courseID)
          ?.course_study_mode?.find(
            (mode) => mode.study_mode === application.studyMode
          )?.tuition_fees ||
        0,
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
    const selectedCourseFee =
      application.paymentPlan?.courseFee ||
      courses
        ?.find((course) => course.id === application.courseID)
        ?.course_study_mode?.find(
          (mode) => mode.study_mode === application.studyMode
        )?.tuition_fees ||
      0;
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
        courseFee:
          application.paymentPlan?.courseFee ||
          courses
            ?.find((course) => course.id === application.courseID)
            ?.course_study_mode?.find(
              (mode) => mode.study_mode === application.studyMode
            )?.tuition_fees,
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
    const courseFee =
      application.paymentPlan?.courseFee ||
      courses
        ?.find((course) => course.id === application.courseID)
        ?.course_study_mode?.find(
          (mode) => mode.study_mode === application.studyMode
        )?.tuition_fees ||
      0;
    if (!courseFee || !form.watch("tuitionFeeAmount")) return;

    const tuitionAmount = Number(form.watch("tuitionFeeAmount"));
    const maintenanceAmount = Number(form.watch("maintenanceLoanAmount"));

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
    courses,
    application.courseID,
    application.studyMode,
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
            ? (application.paymentPlan?.courseFee ||
                courses
                  ?.find((course) => course.id === application.courseID)
                  ?.course_study_mode?.find(
                    (mode) => mode.study_mode === application.studyMode
                  )?.tuition_fees ||
                0) - (form.watch("tuitionFeeAmount") || 0)
            : form.watch("tuitionFeeAmount") || 0)
      ) <= 0.01
    ) {
      form.clearErrors("expectedPayments");
    }
  }, [
    totalAmount,
    form.watch("tuitionFeeAmount"),
    form.watch("usingMaintenanceForTuition"),
    application.paymentPlan?.courseFee,
    courses,
    application.courseID,
    application.studyMode,
  ]);

  useEffect(() => {
    const tuitionFeeAmount = Number(form.watch("tuitionFeeAmount"));
    const courseFee =
      application.paymentPlan?.courseFee ||
      courses
        ?.find((course) => course.id === application.courseID)
        ?.course_study_mode?.find(
          (mode) => mode.study_mode === application.studyMode
        )?.tuition_fees ||
      0;
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
        // 3. Not already using maintenance for tuition
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
    courses,
    application.courseID,
    application.studyMode,
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
              form="student-finance-form"
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
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-700">
                  Payment Options
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {application.paymentPlan?.paymentOption || "Not specified"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-700">
                  Has account with the Student Loan Company (SLC)?
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {application.paymentPlan?.hasSlcAccount === true
                    ? "Yes"
                    : application.paymentPlan?.hasSlcAccount === false
                      ? "No"
                      : "Not specified"}
                </p>
              </div>

              {application.paymentPlan?.hasSlcAccount && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-700">
                      Have you previously received funds from SLC?
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {application.paymentPlan?.previouslyReceivedFunds === true
                        ? "Yes"
                        : application.paymentPlan?.previouslyReceivedFunds ===
                            false
                          ? "No"
                          : "Not specified"}
                    </p>
                  </div>

                  {application.paymentPlan?.previouslyReceivedFunds && (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-700">
                        During which academic year did you receive funding?
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {application.paymentPlan?.previousFundingYear ||
                          "Not specified"}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-700">
                      Have you applied for SLC funding for this course?
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {application.paymentPlan?.appliedForCourse === true
                        ? "Yes"
                        : application.paymentPlan?.appliedForCourse === false
                          ? "No"
                          : "Not specified"}
                    </p>
                  </div>

                  {application.paymentPlan?.appliedForCourse && (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-700">
                        CRN
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {application.paymentPlan?.crn || "Not specified"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {application.paymentPlan?.appliedForCourse && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-700">
                    Application Status
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {application.paymentPlan?.slcStatus || "Not specified"}
                  </p>
                </div>

                {application.paymentPlan?.slcStatus?.startsWith("Approved") && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-700">
                        SSN
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {application.paymentPlan?.ssn || "Not specified"}
                      </p>
                    </div>

                    {(application.paymentPlan?.slcStatus ===
                      "Approved - Tuition Fees & Maintenance Loan" ||
                      application.paymentPlan?.slcStatus ===
                        "Approved - Tuition Fees") && (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Tuition Fee Amount
                        </p>
                        <p className="text-sm font-medium text-neutral-900">
                          {application.paymentPlan?.tuitionFeeAmount
                            ? formatCurrency(
                                application.paymentPlan.tuitionFeeAmount
                              )
                            : "Not specified"}
                        </p>
                      </div>
                    )}

                    {(application.paymentPlan?.slcStatus ===
                      "Approved - Tuition Fees & Maintenance Loan" ||
                      application.paymentPlan?.slcStatus ===
                        "Approved - Maintenance Loan") && (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-neutral-700">
                          Maintenance Loan Amount
                        </p>
                        <p className="text-sm font-medium text-neutral-900">
                          {application.paymentPlan?.maintenanceLoanAmount
                            ? formatCurrency(
                                application.paymentPlan.maintenanceLoanAmount
                              )
                            : "Not specified"}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {application.paymentPlan?.slcStatus?.startsWith("Approved") &&
              application.paymentPlan?.slcStatus !==
                "Approved - Maintenance Loan" && (
                <div className="space-y-4 pb-5">
                  <h3 className="text-sm font-medium">Expected Payments</h3>
                  {application.paymentPlan?.expectedPayments?.length > 0 ? (
                    <div className="rounded-lg border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-neutral-50">
                            <th className="px-4 py-3 text-left text-sm font-bold text-neutral-700">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-neutral-700">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-neutral-700">
                              University
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-neutral-700">
                              Course
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {application.paymentPlan.expectedPayments.map(
                            (payment, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm">
                                  {format(new Date(payment.date), "dd/MM/yyyy")}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                  {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {payment.university}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {payment.course}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      No expected payments have been added yet.
                    </p>
                  )}
                </div>
              )}
          </div>
        ) : (
          <Form {...form}>
            <form
              id="student-finance-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  name="paymentOption"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Options</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger>
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

                <FormField
                  name="hasSlcAccount"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Has account with the Student Loan Company (SLC)?
                      </FormLabel>
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
              </div>
              {form.watch("hasSlcAccount") === "Yes" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    name="previouslyReceivedFunds"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Have you previously received funds from SLC?
                        </FormLabel>
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

                  {form.watch("previouslyReceivedFunds") === "Yes" && (
                    <FormField
                      name="previousFundingYear"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            During which academic year did you receive funding?
                          </FormLabel>
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
                  )}
                  <FormField
                    name="appliedForCourse"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Have you applied for SLC funding for this course?
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "No") {
                              form.reset({
                                ...form.getValues(),
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
                  {form.watch("appliedForCourse") === "Yes" && (
                    <FormField
                      name="crn"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Reference Number (CRN)</FormLabel>
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
                  )}
                </div>
              )}

              {form.watch("appliedForCourse") === "Yes" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    name="slcStatus"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          What is the status of your application?
                        </FormLabel>
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

                  {form.watch("slcStatus")?.startsWith("Approved") && (
                    <FormField
                      name="ssn"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Student Support Number (SSN)
                            <span className="ml-1 text-xs text-muted-foreground">
                              (4 letters, 8 numbers, 1 letter)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSaving}
                              maxLength={13}
                              className="uppercase"
                              onChange={(e) => {
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
                  )}
                </div>
              )}

              {form.watch("slcStatus")?.startsWith("Approved") && (
                <div className="grid gap-6 md:grid-cols-2">
                  {(form.watch("slcStatus") ===
                    "Approved - Tuition Fees & Maintenance Loan" ||
                    form.watch("slcStatus") === "Approved - Tuition Fees") && (
                    <FormField
                      name="tuitionFeeAmount"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tuition Fee Amount</FormLabel>
                          <FormControl>
                            <AmountInput
                              {...field}
                              value={field.value ?? ""}
                              onChange={(value) => {
                                field.onChange(value === "" ? "" : value);
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
                  )}

                  {(form.watch("slcStatus") ===
                    "Approved - Tuition Fees & Maintenance Loan" ||
                    form.watch("slcStatus") ===
                      "Approved - Maintenance Loan") && (
                    <FormField
                      name="maintenanceLoanAmount"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maintenance Loan Amount</FormLabel>
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
                  )}
                </div>
              )}

              {showMaintenanceOption && (
                <div className="rounded-md bg-neutral-100 p-4 space-y-4">
                  <p className="text-sm font-medium">
                    Would you like to use your maintenance loan to cover the
                    remaining tuition fee of {formatCurrency(feeDifference)}?
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
                            amount: feeDifference - paymentAmount,
                            university: "Plymouth Marjon University",
                            course: application.courseTitle,
                          },
                        ];
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

              {isEditing && shortFall && form.watch("tuitionFeeAmount") && (
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Administrative Review Required:</strong> The SLC
                    tuition fee amount (
                    {formatCurrency(form.watch("tuitionFeeAmount"))}) is less
                    than the course fee (
                    {formatCurrency(
                      application.paymentPlan?.courseFee ||
                        courses
                          ?.find((course) => course.id === application.courseID)
                          ?.course_study_mode?.find(
                            (mode) => mode.study_mode === application.studyMode
                          )?.tuition_fees ||
                        0
                    )}
                    ).
                    {showMaintenanceOption ? (
                      <span>
                        {" "}
                        You may use your maintenance loan to cover the
                        difference of {formatCurrency(shortFall)}.
                      </span>
                    ) : (
                      <span>
                        {" "}
                        This application will be under administrative review.
                      </span>
                    )}
                  </p>
                </div>
              )}
              {(form.watch("slcStatus") ===
                "Approved - Tuition Fees & Maintenance Loan" ||
                form.watch("slcStatus") === "Approved - Tuition Fees") && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Expected Payments</h3>
                    {fields.length < 3 && (
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
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment
                      </Button>
                    )}
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid gap-4 rounded-lg border p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          name={`expectedPayments.${index}.date`}
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      disabled={isSaving}
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
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > addYears(new Date(), 3) ||
                                      date < new Date("1900-01-01")
                                    }
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
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <AmountInput
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(value) =>
                                    field.onChange(value === "" ? "" : value)
                                  }
                                  disabled={isSaving}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          name={`expectedPayments.${index}.university`}
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>University</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isSaving} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {index > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => remove(index)}
                          disabled={isSaving}
                        >
                          Remove Payment
                        </Button>
                      )}
                    </div>
                  ))}

                  {form.formState.errors.expectedPayments && (
                    <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.expectedPayments.message}
                    </p>
                  )}

                  {form.formState.errors.expectedPayments?.root?.message && (
                    <p className="mt-2 text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.expectedPayments.root.message}
                    </p>
                  )}

                  {form.watch("slcStatus")?.startsWith("Approved") && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Payment Summary</h3>
                      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="grid divide-y">
                          <div className="grid grid-cols-2 items-center p-4">
                            <div className="text-sm text-neutral-600">
                              Course Fee
                            </div>
                            <div className="text-right text-sm font-medium text-neutral-900">
                              {formatCurrency(
                                application.paymentPlan?.courseFee ||
                                  courses
                                    ?.find(
                                      (course) =>
                                        course.id === application.courseID
                                    )
                                    ?.course_study_mode?.find(
                                      (mode) =>
                                        mode.study_mode ===
                                        application.studyMode
                                    )?.tuition_fees ||
                                  0
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 items-center p-4">
                            <div className="text-sm text-neutral-600">
                              Required Payment Amount
                            </div>
                            <div className="text-right text-sm font-medium text-neutral-900">
                              {formatCurrency(
                                form.watch("tuitionFeeAmount") || 0
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 items-center p-4">
                            <div className="text-sm text-neutral-600">
                              Total Expected Payments
                            </div>
                            <div
                              className={cn(
                                "text-right text-sm font-medium",
                                form.watch("tuitionFeeAmount")
                                  ? Math.abs(
                                      totalAmount -
                                        (form.watch(
                                          "usingMaintenanceForTuition"
                                        )
                                          ? (application.paymentPlan
                                              ?.courseFee ||
                                              courses
                                                ?.find(
                                                  (course) =>
                                                    course.id ===
                                                    application.courseID
                                                )
                                                ?.course_study_mode?.find(
                                                  (mode) =>
                                                    mode.study_mode ===
                                                    application.studyMode
                                                )?.tuition_fees ||
                                              0) -
                                            (form.watch("tuitionFeeAmount") ||
                                              0)
                                          : form.watch("tuitionFeeAmount") || 0)
                                    ) <= 0.01
                                    ? "text-green-600"
                                    : "text-destructive"
                                  : "text-neutral-900"
                              )}
                            >
                              {formatCurrency(totalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4 pb-3">
                <FormField
                  control={form.control}
                  name="tuition_doc"
                  render={({ field }) => (
                    <FormItem className="pb-4">
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
            </form>
          </Form>
        )}

        {fileData.length > 0 && (
          <div className="mt-1 rounded-lg border">
            <FilesTable data={fileData} columns={fileColumns} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFinanceDetails;