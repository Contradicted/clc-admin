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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, useToast } from "@/components/ui/use-toast";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

const StatusButton = ({ application }) => {
  const [open, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      status: application?.status !== "Submitted" ? application?.status : "",
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
      updateStatus(values.status, application.id)
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
        <Button size="default2">Status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status of Application</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
          <DialogDescription>
            Please select a status from the list below
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-[50px]">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Waiting_for_Change">
                            Waiting for Change
                          </SelectItem>
                          <SelectItem value="Re_Submitted">
                            Re-Submitted
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
                  <p>Save changes</p>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusButton;
