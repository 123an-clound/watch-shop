import { z } from "zod";
import { PHONE_REGEX } from "../orders/schemas";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(PHONE_REGEX, "phone"));

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "required").max(120, "tooLong"),
  phone: z.union([z.literal(""), phone]),
});

export const addressSchema = z.object({
  id: z.uuid().optional(),
  recipientName: z.string().trim().min(1, "required").max(120, "tooLong"),
  phone: z.string().trim().min(1, "required").pipe(phone),
  province: z.string().trim().min(1, "required").max(120, "tooLong"),
  ward: z.string().trim().min(1, "required").max(120, "tooLong"),
  street: z.string().trim().min(1, "required").max(255, "tooLong"),
  note: z.string().trim().max(500, "tooLong"),
  isDefault: z.boolean(),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;
export type AddressInput = z.input<typeof addressSchema>;
export type AddressValues = z.output<typeof addressSchema>;
