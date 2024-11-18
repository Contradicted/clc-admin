"use client";

import { register } from "@/actions/register";
import { Button } from "@/components/ui/button";
import { FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  EyeIcon,
  EyeOffIcon,
  LoaderCircle,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

const RegisterPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values) => {
    startTransition(() => {
      register(values)
        .then((data) => {
          if (data?.success) {
            form.reset();

            toast({
              variant: "success",
              title: "Successfully created the user!",
            });

            router.push("/auth/login");
          }

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Logo Section */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="relative w-full max-w-[400px] aspect-square">
          <Image
            src="/clc.png"
            fill
            className="object-contain"
            alt="CLC Logo"
            priority
          />
        </div>
      </div>

      {/* Form Section */}
      <div className="lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="max-w-[450px] mx-auto w-full">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Create an account
          </h2>
          <p className="text-gray-600 mb-8">
            Sign up for your CLC Admin account
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* First Name Field */}
            <FormField
              name="firstName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type="text"
                      disabled={isPending}
                      placeholder="Enter your first name"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-6 pr-10 text-sm 
                      transition-colors placeholder:text-gray-400
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                      disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </FormItem>
              )}
            />

            {/* Last Name Field */}
            <FormField
              name="lastName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type="text"
                      disabled={isPending}
                      placeholder="Enter your last name"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-6 pr-10 text-sm 
                      transition-colors placeholder:text-gray-400
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                      disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type="email"
                      disabled={isPending}
                      placeholder="Enter your email"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-6 pr-10 text-sm 
                      transition-colors placeholder:text-gray-400
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                      disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type={isVisible ? "text" : "password"}
                      placeholder="Create a password"
                      disabled={isPending}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-6 pr-20 text-sm 
                      transition-colors placeholder:text-gray-400
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                      disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setIsVisible(!isVisible)}
                        className="h-8 w-8 p-0 hover:bg-transparent"
                      >
                        {isVisible ? (
                          <EyeOffIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </Button>
                      <LockKeyhole className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg
              transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/90 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
