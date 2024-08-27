import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const RegisterSchema = z.object({
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const addNoteSchema = z.object({
  content: z
    .string({
      required_error: "You must enter a note message",
    })
    .min(1, {
      message: "You must add a note",
    }),
});

export const InterviewSchema = z.object({
  date: z.date({
    required_error: "Please enter a date/time",
  }),
});
