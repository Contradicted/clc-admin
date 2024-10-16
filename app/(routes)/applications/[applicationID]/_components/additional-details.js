"use client";

import { updateAdditionalInfo } from "@/actions/update-application";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
    <div className="border-stroke space-y-4 mt-4">
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

          <div className="w-full space-y-6 pb-4">
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                <p>Special needs requiring support or facilities</p>
              </div>
              {isEditing ? (
                <FormField
                  name="specialNeeds"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.specialNeeds}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Reasons for choosing programme of study
              </div>
              {isEditing ? (
                <FormField
                  name="reasonsForChoosingProgram"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.reasonsForChoosingProgram}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                What are your future education plans?
              </div>
              {isEditing ? (
                <FormField
                  name="futureEduPlans"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.futureEduPlans}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                What employment do you intend to seek on completion of your
                studies?
              </div>
              {isEditing ? (
                <FormField
                  name="intentedEmployment"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.intentedEmployment}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Are you currently on any state benefits?
              </div>
              {isEditing ? (
                <FormField
                  name="stateBenefits"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.stateBenefits}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Do you have any criminal record(s) within or outside the UK?
              </div>
              {isEditing ? (
                <FormField
                  name="criminalRecord"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.criminalRecord}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Brief statement about your interests and hobbies
              </div>
              {isEditing ? (
                <FormField
                  name="hobbies"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.hobbies}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Ethnic Origin
              </div>
              {isEditing ? (
                <FormField
                  name="ethnicity"
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
                            {ethnicities.map((eth, index) => (
                              <SelectItem value={eth.value} key={index}>
                                {eth.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {getDisplayEthnicity(application.ethnicity)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Religion
              </div>
              {isEditing ? (
                <FormField
                  name="religion"
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
                            {religions.map((rel, index) => (
                              <SelectItem value={rel.value} key={index}>
                                {rel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {getDisplayReligion(application.religion)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                How did you hear about the college?
              </div>
              {isEditing ? (
                <FormField
                  name="marketing"
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
                            {marketing.map((opt, index) => (
                              <SelectItem value={opt.value} key={index}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.marketing}
                </p>
              )}
            </div>

            {form.watch("marketing") === "Recruitment Agent" && (
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%]">
                  Recruitment Agent
                </div>
                {isEditing ? (
                  <FormField
                    name="recruitment_agent"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className="flex flex-wrap font-medium text-black w-full">
                    {application.recruitment_agent}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Agreed to Terms and Conditions
              </div>
              {isEditing ? (
                <FormField
                  name="terms"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "yes")
                          }
                          value={field.value ? "yes" : "no"}
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
                  {application.terms ? "Yes" : "No"}
                </p>
              )}
            </div>
          </div>

          {/* <div className="w-full space-y-4 pb-4">
            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                <p>Special needs requiring support or facilities</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.specialNeeds}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Reasons for choosing programme of study
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.reasonsForChoosingProgram}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                What are your future education plans?
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.futureEduPlans}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                What employment do you intend to seek on completion of your
                studies?
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.intentedEmployment}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Brief statement about your interests and hobbies
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.hobbies}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Ethnic Origin
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {getDisplayEthnicity(application.ethnicity)}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Religion
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {getDisplayReligion(application.religion)}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                How did you hear about the college?
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.marketing}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex items-start w-full max-w-[50%]">
                Agreed to Terms and Conditions
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {application.terms ? "Yes" : "No"}
              </p>
            </div>

            {application.recruitment_agent && (
              <div className="flex gap-3">
                <div className="flex items-start w-full max-w-[50%]">
                  Name of Recruitment Agent
                </div>
                <p className="flex flex-wrap font-medium text-black w-full">
                  {application.recruitment_agent}
                </p>
              </div>
            )}
          </div> */}
        </form>
      </Form>
    </div>
  );
};

export default AdditionalDetails;
