"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { toast, useToast } from "@/components/ui/use-toast";
import { LoaderCircle, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addNoteSchema } from "@/schemas";
import { addNote } from "@/actions/add-note";

const AddNoteButton = ({ application }) => {
  const [open, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(addNoteSchema),
    defaultValues: {
      content: "",
    },
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
      addNote(values, application.id, "Admin")
        .then((data) => {
          if (data?.success) {
            setIsOpen(false);

            toast({
              variant: "success",
              title: data.success,
            });

            router.refresh();
          }
        })
        .catch((error) => {
          console.log(error);
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
        <Button size="icon" className="rounded-xl">
          <SquarePen className="size-4 cursor-pointer" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
          <DialogDescription>Please enter your note below</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      className={`${form.formState.errors.content && "border-red"} resize-none`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <p>Add Note</p>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteButton;
