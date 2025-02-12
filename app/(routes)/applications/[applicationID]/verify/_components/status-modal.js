"use client";

import { updateStatus } from "@/actions/update-status";
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
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

const StatusModal = ({
  applicationID,
  name,
  title,
  desc,
  status,
  className,
  isDisabled,
}) => {
  const [open, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

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
      updateStatus(values.message, applicationID, status)
        .then((data) => {
          if (data?.success) {
            setIsOpen(false);

            toast({
              variant: "success",
              title: data.success,
            });

            router.refresh();
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
        <Button className={className} disabled={isDisabled}>{name}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Please enter a message" />
                  </FormControl>
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

export default StatusModal;
