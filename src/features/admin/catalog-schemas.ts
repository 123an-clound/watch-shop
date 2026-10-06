import { z } from "zod";

// Admin UI is Vietnamese-only; messages are i18n keys under "Validation".
const slug = z
  .string()
  .trim()
  .min(1, "required")
  .max(80, "tooLong")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug");
const text = (max: number) => z.string().trim().max(max, "tooLong");
const required = (max: number) => text(max).min(1, "required");
const optionalUuid = z.union([z.uuid(), z.literal("")]);

export const categorySchema = z.object({
  id: z.uuid().optional(),
  slug,
  name_vi: required(120),
  name_en: required(120),
  parent_id: optionalUuid,
  sort_order: z.coerce.number<number>().int("invalid").min(0, "invalid").max(9999, "invalid"),
});

export const brandSchema = z.object({
  id: z.uuid().optional(),
  slug,
  name: required(120),
  logo_url: z.union([z.url("invalid").max(500, "tooLong"), z.literal("")]),
  description_vi: text(5000),
  description_en: text(5000),
});

export const featureSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "required")
    .max(40, "tooLong")
    .regex(/^[a-z0-9_]+$/, "featureKey"),
  value: required(120),
});

export const imageSchema = z.object({
  storage_path: z.string().min(1).max(500),
  alt_vi: text(200),
  alt_en: text(200),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const money = z.coerce
  .number<number>()
  .int("invalid")
  .min(0, "invalid")
  .max(100_000_000_000, "invalid");

export const productSchema = z
  .object({
    id: z.uuid().optional(),
    slug,
    sku: required(64),
    name_vi: required(200),
    name_en: required(200),
    description_vi: text(10000),
    description_en: text(10000),
    price: money,
    compare_at_price: z.union([z.literal(""), money]),
    stock: z.coerce.number<number>().int("invalid").min(0, "invalid").max(100000, "invalid"),
    category_id: optionalUuid,
    brand_id: optionalUuid,
    features: z.array(featureSchema).max(30, "tooLong"),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    seo_title_vi: text(120),
    seo_title_en: text(120),
    seo_description_vi: text(320),
    seo_description_en: text(320),
    images: z.array(imageSchema).max(20, "tooLong"),
  })
  .refine((v) => v.compare_at_price === "" || v.compare_at_price > v.price, {
    message: "compareAtPrice",
    path: ["compare_at_price"],
  })
  .refine((v) => new Set(v.features.map((f) => f.key)).size === v.features.length, {
    message: "featureDuplicate",
    path: ["features"],
  });

export type CategoryInput = z.input<typeof categorySchema>;
export type BrandInput = z.input<typeof brandSchema>;
export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
export type ProductImageInput = z.infer<typeof imageSchema>;
