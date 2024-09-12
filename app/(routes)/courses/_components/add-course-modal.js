"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { courses } from "@/actions/courses";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  code: z.string().min(1, {
    message: "Course code is required",
  }),
  name: z.string().min(1, {
    message: "Course name is required",
  }),
});

const AddCourseModal = () => {
  const [open, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
    },
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form]);

  const handleOpenChange = (open) => {
    if (isPending) {
      return;
    }

    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = (values) => {
    startTransition(() => {
      courses(values)
        .then((data) => {
          if (data?.success) {
            setIsOpen(false);

            toast({
              variant: "success",
              title: data.success,
            });

            router.push(`/courses/${data.courseId}`);
          }

          if (data?.error) {
            setIsOpen(false);

            toast({
              variant: "destructive",
              title: data.error,
            });
          }
        })
        .catch((error) => {
          setIsOpen(false);
          toast({
            variant: "destructive",
            title: error,
          });
        })
        .finally(() => {
          setIsOpen(false);
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Course</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
          <DialogDescription>Enter details for the course</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-x-4 space-y-5">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="Eg. HNC24C"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="Eg. BTEC Higher National Certificate in Computing"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-6">
              <DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending || !form.formState.isValid}
              >
                {isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <p>Submit</p>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;
