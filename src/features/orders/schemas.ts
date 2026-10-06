import { z } from "zod";

// Messages are i18n keys under "Validation".
export const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
export const ORDER_CODE_REGEX = /^LW-\d{6}-[A-Z0-9]{4}$/;

const phone = z
  .string()
  .trim()
  .min(1, "required")
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(PHONE_REGEX, "phone"));

export const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  phone,
  email: z.union([z.literal(""), z.string().trim().max(254, "tooLong").pipe(z.email("email"))]),
  province: z.string().trim().min(1, "required").max(120, "tooLong"),
  ward: z.string().trim().min(1, "required").max(120, "tooLong"),
  street: z.string().trim().min(1, "required").max(255, "tooLong"),
  note: z.string().trim().max(500, "tooLong"),
  /** Honeypot — real users never fill this. */
  company: z.string().max(200),
  turnstileToken: z.string().max(4096).optional(),
});

export const placeOrderSchema = z.object({
  form: checkoutSchema,
  items: z.array(cartItemSchema).min(1).max(50),
  locale: z.enum(["vi", "en"]),
});

export const trackSchema = z.object({
  code: z.string().trim().toUpperCase().regex(ORDER_CODE_REGEX, "invalid"),
  phone,
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;
export type TrackInput = z.input<typeof trackSchema>;
export type TrackValues = z.output<typeof trackSchema>;
