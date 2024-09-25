"use client";

import { useForm } from "react-hook-form";

import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/use-toast";
import { updateUser } from "@/actions/update-user";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const AccountSettingsForm = ({ user }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      title: user.title || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "",
    },
  });

  const onSubmit = (values) => {
    startTransition(() => {
      updateUser(values)
        .then((data) => {
          if (data?.success) {
            toast({
              variant: "success",
              title: data.success,
            });

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
          toast({
            variant: "destructive",
            title: error.message,
          });
        })
        .finally(() => {
          form.reset();
          router.refresh();
        });
    });
  };

  return (
    <div className="mx-auto max-w-270">
      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-5 xl:col-span-3">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Personal Information
              </h3>
            </div>
            <div className="p-7">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Title
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12.5 w-full rounded border border-stroke bg-gray py-3 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary">
                                  <SelectValue placeholder="Select a title" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="Mr">Mr</SelectItem>
                                  <SelectItem value="Mrs">Mrs</SelectItem>
                                  <SelectItem value="Ms">Ms</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-3 block text-sm font-medium text-black dark:text-white">
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-12.5 w-full rounded border border-stroke bg-gray py-3 pr-4.5 text-black focus:border-primary focus-visible:outline-none focus-visible:ring-0 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="mb-3 block text-sm font-medium text-black dark:text-white">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-12.5 w-full rounded border border-stroke bg-gray py-3 pr-4.5 text-black focus:border-primary focus-visible:outline-none focus-visible:ring-0 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-3 block text-sm font-medium text-black dark:text-white">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-4.5 top-4 size-5 text-muted-foreground" />
                              <Input
                                {...field}
                                disabled
                                type="email"
                                className="h-12.5 w-full rounded border border-stroke bg-gray py-3 pl-14 pr-4.5 text-black focus:border-primary focus-visible:outline-none focus-visible:ring-0 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mb-5.5">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-3 block text-sm font-medium text-black dark:text-white">
                            Change Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              {showPassword ? (
                                <EyeOff
                                  className="absolute right-4.5 top-4 size-5 cursor-pointer"
                                  onClick={() => setShowPassword(false)}
                                />
                              ) : (
                                <Eye
                                  className="absolute right-4.5 top-4 size-5 cursor-pointer"
                                  onClick={() => setShowPassword(true)}
                                />
                              )}
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                className="h-12.5 w-full rounded border border-stroke bg-gray py-3 pr-4.5 text-black focus:border-primary focus-visible:outline-none focus-visible:ring-0 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground italic">
                            Leave blank to keep the same password. Password must
                            be at least 6 characters.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsForm;
