"use client";

import { login } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  EyeIcon,
  EyeOffIcon,
  LoaderCircle,
  LockKeyhole,
  LockKeyholeIcon,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

const LoginPage = () => {
  const [isVisible, setIsVisible] = useState(false);
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
            Welcome back
          </h2>
          <p className="text-gray-600 mb-8">
            Sign in to your CLC Admin account
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      placeholder="Enter your password"
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
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors hover:bg-transparent"
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
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
