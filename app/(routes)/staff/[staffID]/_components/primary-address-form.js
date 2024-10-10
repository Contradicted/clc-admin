"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import countries from "i18n-iso-countries";
import countriesEnglish from "i18n-iso-countries/langs/en.json";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { staff } from "@/actions/staff";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEditing } from "@/providers/editing-provider";

countries.registerLocale(countriesEnglish);
const postcodeRegEx = /^[a-z]{1,2}[0-9][0-9a-z]? ?[0-9][abd-hjlnp-uw-z]{2}$/i;

const formSchema = z.object({
  address: z.string().min(1, { message: "Address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  postcode: z
    .string()
    .min(1, { message: "Postcode is required" })
    .regex(postcodeRegEx, { message: "Invalid postcode" }),
  country: z.string().min(1, { message: "Country is required" }),
});

const PrimaryAddressForm = ({ initialData, staffID }) => {
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const { isEditing, setIsEditing } = useEditing();

  const router = useRouter();
  const { toast } = useToast();

  const requiredFields = [
    initialData.address,
    initialData.city,
    initialData.postcode,
    initialData.country,
  ];

  const form = useForm({
    defaultValues: {
      address: initialData.address || "",
      city: initialData.city || "",
      postcode: initialData.postcode || "",
      country: initialData.country || "",
    },
    resolver: zodResolver(formSchema),
  });

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setIsFormEditing(!isFormEditing);
  };

  const onSubmit = (values) => {
    startTransition(() => {
      staff(values, staffID)
        .then((data) => {
          if (data?.success) {
            toast({
              variant: "success",
              title: data.success,
            });

            toggleEdit();
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
          setIsEditing(false);
        });
    });
  };

  return (
    <div className="flex flex-col gap-9">
      <div className="relative px-6.5 py-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center">
              <h3 className="w-full text-lg font-semibold text-black">
                Primary Address
              </h3>
              {isFormEditing && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              )}
            </div>
            <div className="absolute -right-4 -top-4 bg-gray rounded-full size-8 flex items-center justify-center">
              <Button
                type="button"
                variant="icon"
                onClick={toggleEdit}
                className="group"
                disabled={isEditing && !isFormEditing}
              >
                {isFormEditing ? (
                  <X className="size-4 group-hover:text-black/70" />
                ) : (
                  <Pencil className="size-4 group-hover:text-black/70" />
                )}
              </Button>
            </div>
            {isFormEditing && (
              <div className="w-full mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-3">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Eg. 123 Main St"
                          disabled={isSaving}
                          className={
                            form.formState.errors.address && "border-red"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Eg. London"
                          disabled={isSaving}
                          className={form.formState.errors.city && "border-red"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Eg. E1 5AB"
                          className={
                            form.formState.errors.postcode && "border-red"
                          }
                          disabled={isSaving}
                          onChange={(e) => {
                            let value = e.target.value
                              .toUpperCase()
                              .replace(/\s/g, "");
                            if (value.length > 4) {
                              value =
                                value.slice(0, -3) + " " + value.slice(-3);
                            }
                            field.onChange(value);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className={
                            form.formState.errors.country && "border-red"
                          }
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent position="top">
                            <SelectGroup>
                              <SelectLabel>Most used</SelectLabel>
                              {Object.entries(countries.getNames("en"))
                                .filter(
                                  ([code, name]) => name === "United Kingdom"
                                )
                                .map(([code, name]) => (
                                  <SelectItem key={code} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>All Countries</SelectLabel>
                              {Object.entries(countries.getNames("en"))
                                .filter(
                                  ([code, country]) =>
                                    country !== "United Kingdom"
                                )
                                .map(([code, country]) => (
                                  <SelectItem key={code} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {!isFormEditing && (
              <div
                className={cn(
                  "text-sm mt-2",
                  !requiredFields.every(Boolean) && "italic"
                )}
              >
                {requiredFields.some(Boolean) ? (
                  <div className="mt-5 grid grid-cols-6 flex-wrap gap-x-4 gap-y-4">
                    <div className="flex flex-col gap-y-2 break-words col-span-2">
                      <p className="text-sm text-zinc-400 font-medium">
                        Address
                      </p>
                      <span className="text-sm font-medium text-graydark">
                        {initialData.address || "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-y-2 break-words">
                      <p className="text-sm text-zinc-400 font-medium">City</p>
                      <span className="text-sm font-medium text-graydark">
                        {initialData.city || "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-y-2 break-words">
                      <p className="text-sm text-zinc-400 font-medium">
                        Post Code
                      </p>
                      <span className="text-sm font-medium text-graydark">
                        {initialData.postcode || "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-y-2 break-words">
                      <p className="text-sm text-zinc-400 font-medium">
                        Country
                      </p>
                      <span className="text-sm font-medium text-graydark col-span-2">
                        {initialData.country || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  "No primary address has been set"
                )}
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PrimaryAddressForm;
