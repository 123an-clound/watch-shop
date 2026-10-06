import { z } from "zod";

// Messages are i18n keys under the "Validation" namespace.
const email = z.string().trim().min(1, "required").max(254, "tooLong").pipe(z.email("email"));
const password = z.string().min(8, "passwordMin").max(72, "tooLong");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "required").max(72, "tooLong"),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "required").max(120, "tooLong"),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
