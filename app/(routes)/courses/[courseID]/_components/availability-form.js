"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState, useTransition } from "react";
import { PencilIcon, Loader2 } from "lucide-react";
import { courses } from "@/actions/courses";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  availability: z.coerce
    .number()
    .min(1, "Availability must be at least 1")
    .max(1000, "Availability cannot exceed 1000"),
});

const AvailabilityForm = ({ initialData, courseID }) => {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      availability: initialData?.availability || "",
    },
  });

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const onSubmit = async (values) => {
    try {
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
      toast.success("Course availability updated");
      setIsEditing(false);
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="flex flex-col gap-9 mt-6">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 font-medium flex items-center justify-between">
          Course Availability
          <Button variant="ghost" className="gap-x-2" onClick={toggleEdit}>
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <PencilIcon className="size-4" />
                Edit Course Availability
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground px-6.5 py-2 border-b border-stroke">
          Set the maximum number of students that can be enrolled in this
          course.
        </p>
        {!isEditing && (
          <p
            className={cn(
              "text-sm mt-2 px-6.5 py-4",
              !initialData?.availability && "italic"
            )}
          >
            {initialData?.availability || "Not set"}
          </p>
        )}
        {isEditing && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-4 px-6.5 py-4"
            >
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="Eg. 100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

export default AvailabilityForm;
