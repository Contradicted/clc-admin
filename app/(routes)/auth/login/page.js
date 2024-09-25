"use client";

import { login } from "@/actions/login";
import { FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { LoaderCircle, LockKeyhole, LockKeyholeIcon, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

const LoginPage = () => {
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL");

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values) => {
    startTransition(() => {
      login(values, callbackURL)
        .then((data) => {
          if (data?.error) {
            toast({
              variant: "destructive",
              title: data.error,
            });
          }
        })
        .finally(() => {
          form.reset();
        });
    });
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="flex items-center justify-center border-r-2 border-r-stroke">
        <Image src="/clc.png" width={400} height={400} alt="Logo" />
      </div>
      <div className="w-full p-4 sm:p-12.5 xl:p-17.5 flex flex-col justify-center">
        <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
          Sign In to CLC Admin
        </h2>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type="email"
                      disabled={isPending}
                      placeholder="Email"
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />

                    <span className="absolute right-4 top-4">
                      <Mail className="stroke-[1.5] text-neutral-400" />
                    </span>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="mb-6">
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type="password"
                      placeholder="Password"
                      disabled={isPending}
                      className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />

                    <span className="absolute right-4 top-4">
                      <LockKeyhole className="stroke-[1.5] text-neutral-400" />
                    </span>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="mb-5">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full justify-center cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
            >
              {isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <p>Sign in</p>
              )}
            </button>
          </div>

          {/* <div className="mt-6 text-center" disabled={isPending}>
            <p>
              Don’t have any account?{" "}
              <Link href="/auth/register" className="text-primary">
                Sign Up
              </Link>
            </p>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
