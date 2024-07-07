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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import SendSMSModal from "./send-sms-modal";

import {
  Dialog,
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
import { ID, messaging } from "@/lib/appwrite";

const StudentActions = ({ studentID }) => {
  const form = useForm({
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await messaging.createSms(ID.unique(), values.message, [], [studentID]);

      console.log("Done");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog>
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
                    <Input placeholder="Enter message" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="mt-2">
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-md bg-meta-1 px-8 py-2.5 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-6"
              >
                Cancel
              </Link>
              <Button type="submit">Send SMS</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentActions;
