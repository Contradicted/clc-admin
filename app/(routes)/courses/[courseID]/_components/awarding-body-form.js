"use client";

import { courses } from "@/actions/courses";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  awarding_body: z.string().min(1, {
    message: "Awarding body is required",
  }),
});

const AwardingBodyForm = ({ initialData, courseID }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    defaultValues: {
      awarding_body: initialData.awarding_body || "",
    },
    resolver: zodResolver(formSchema),
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
          Awarding Body
          <Button variant="ghost" className="gap-x-2" onClick={toggleEdit}>
            {isEditing ? (
              <>Cancel</>
            ) : (
              <>
                <PencilIcon className="size-4" />
                Edit Awarding Body
              </>
            )}
          </Button>
        </div>
        {!isEditing && (
          <p
            className={cn(
              "text-sm mt-2 px-6.5 py-4",
              !initialData.awarding_body && "italic"
            )}
          >
            {initialData.awarding_body ||
              "Awarding body for course has not been set"}
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
                name="awarding_body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="Eg. Pearsons"
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

export default AwardingBodyForm;