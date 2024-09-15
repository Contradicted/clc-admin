"use client";

import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { startTransition, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import SendSMSModal from "./send-sms-modal";

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
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { sendSMS } from "@/actions/twilio";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const StudentActions = ({ studentID }) => {
  const [isPending, startTransition] = useTransition();
  const [open, setIsOpen] = useState(false);

  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (values) => {
    startTransition(() => {
      sendSMS(values.message).then((data) => {
        if (data?.success) {
          toast({
            variant: "success",
            title: "SMS Message sent successfully!",
          });
        }

        if (data?.error) {
          // ADD Toast
        }

        setIsOpen(false);
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setIsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6"
          >
            Actions
          </Link>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <span className="cursor-pointer">Send SMS</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS Message</DialogTitle>
          <div className="border-2 border-primary w-[25%] rounded-sm" />
          <DialogDescription>
            Please fill in the following details to send a SMS message
          </DialogDescription>
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
                    <Input
                      placeholder="Enter message"
                      disabled={isPending}
                      {...field}
                    />
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
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <p>Send SMS</p>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentActions;
