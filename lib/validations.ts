import { z } from "zod";

export const emailSchema = z.string().email().toLowerCase().trim();

export const checkEmailSchema = z.object({
  email: emailSchema,
});

export const sendOtpSchema = z.object({
  email: emailSchema,
  type: z.enum(["login", "signup", "reset"]),
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6).regex(/^\d+$/),
  type: z.enum(["login", "signup", "reset"]),
});

export const phoneSchema = z
  .string()
  .min(10)
  .max(15)
  .regex(/^[+]?[\d\s-]{10,15}$/)
  .transform((s) => s.replace(/\s/g, "").trim());

export const registerSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(2, "At least 2 characters").max(50).trim(),
  lastName: z.string().min(2, "At least 2 characters").max(50).trim(),
  phone: phoneSchema,
  // role is always "client" — developer platform is separate
  role: z.enum(["client", "developer"]).default("client"),
  otp: z.string().length(6).regex(/^\d+$/),
});

export type CheckEmailBody = z.infer<typeof checkEmailSchema>;
export type SendOtpBody = z.infer<typeof sendOtpSchema>;
export type VerifyOtpBody = z.infer<typeof verifyOtpSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
