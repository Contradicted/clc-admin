"use client";

import { updateAdditionalInfo } from "@/actions/update-application";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ethnicities, marketing, religions } from "@/constants";
import { getDisplayEthnicity, getDisplayReligion } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
  .object({
    specialNeeds: z.string().min(1, { message: "Required" }),
    reasonsForChoosingProgram: z.string().min(1, { message: "Required" }),
    futureEduPlans: z.string().min(1, { message: "Required" }),
    intentedEmployment: z.string().min(1, { message: "Required" }),
    stateBenefits: z.string().min(1, { message: "Required" }),
    criminalRecord: z.string().min(1, { message: "Required" }),
    hobbies: z.string().min(1, { message: "Required" }),
    ethnicity: z.string().min(1, { message: "Required" }),
    religion: z.string().min(1, { message: "Required" }),
    marketing: z.string().min(1, { message: "Required" }),
    terms: z
      .boolean({
        required_error: "You must agree to the terms and conditions",
      })
      .refine((val) => val === true, {
        message: "You must agree to the terms and conditions",
      }),
    recruitment_agent: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.marketing === "Recruitment Agent") {
        return !!data.recruitment_agent;
      }
      return true;
    },
    {
      message: "Enter recruitment agent",
      path: ["recruitment_agent"],
    }
  );

const AdditionalDetails = ({ application }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      specialNeeds: application.specialNeeds,
      reasonsForChoosingProgram: application.reasonsForChoosingProgram,
      futureEduPlans: application.futureEduPlans,
      intentedEmployment: application.intentedEmployment,
      stateBenefits: application.stateBenefits,
      criminalRecord: application.criminalRecord,
      hobbies: application.hobbies,
      ethnicity: application.ethnicity,
      religion: application.religion,
      marketing: application.marketing,
      terms: application.terms,
      recruitment_agent: application.recruitment_agent,
    },
    resolver: zodResolver(formSchema),
  });

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const onSubmit = (values) => {
    startTransition(() => {
      updateAdditionalInfo(values, application.id).then((data) => {
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

  return (
    <div className="mt-6 mb-4 rounded-lg border bg-white shadow">
      <div className="flex items-center justify-end border-b px-5 py-3">
        {!isEditing ? (
          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsEditing(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
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
              form="additional-details-form"
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
            <div className="grid gap-16 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Special needs requiring support or facilities
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.specialNeeds || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Reasons for choosing programme of study
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.reasonsForChoosingProgram || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    What are your future educational plans?
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.futureEduPlans || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    What employment do you intend to seek on completion of your
                    studies?
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.intentedEmployment || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Are you currently on any state benefits?
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.stateBenefits || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Do you have any criminal record(s) within or outside the UK?
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.criminalRecord || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Brief statement about your interests and hobbies
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.hobbies || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Ethnic Origin
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {getDisplayEthnicity(application.ethnicity) ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Religion
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {getDisplayReligion(application.religion) ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    How did you hear about us?
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.marketing || "Not specified"}
                  </p>
                </div>

                {application.marketing === "Recruitment Agent" && (
                  <div>
                    <label className="text-sm font-bold text-gray-500">
                      Recruitment Agent
                    </label>
                    <p className="mt-1 text-gray-900 break-words">
                      {application.recruitment_agent || "Not specified"}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold text-gray-500">
                    Agreed to Terms and Conditions
                  </label>
                  <p className="mt-1 text-gray-900 break-words">
                    {application.terms ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              id="additional-details-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    name="specialNeeds"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Special needs requiring support or facilities
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="reasonsForChoosingProgram"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Reasons for choosing programme of study
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="futureEduPlans"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Future education plans
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="intentedEmployment"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Intended employment
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="stateBenefits"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          State benefits
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="criminalRecord"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Criminal record
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="hobbies"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Hobbies
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    name="ethnicity"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Ethnicity
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ethnicity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ethnicities.map((ethnicity) => (
                              <SelectItem
                                key={ethnicity.value}
                                value={ethnicity.value}
                              >
                                {ethnicity.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="religion"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          Religion
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select religion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {religions.map((religion) => (
                              <SelectItem
                                key={religion.value}
                                value={religion.value}
                              >
                                {religion.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="marketing"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-500">
                          How did you hear about us?
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSaving}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {marketing.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("marketing") === "Recruitment Agent" && (
                    <FormField
                      name="recruitment_agent"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-500">
                            Recruitment Agent
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default AdditionalDetails;
