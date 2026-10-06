import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, "tooLong");
const optionalUrl = z.union([z.literal(""), z.url("invalid").max(300, "tooLong")]);
const money = z.coerce
  .number<number>()
  .int("invalid")
  .min(0, "invalid")
  .max(1_000_000_000, "invalid");

export const settingsSchema = z.object({
  store_name: text(120).min(1, "required"),
  contact_email: z.union([z.literal(""), z.email("email").max(254, "tooLong")]),
  contact_phone: text(20),
  address: text(500),
  hero_image_path: z.string().max(500).nullable(),
  hero_title_vi: text(200),
  hero_title_en: text(200),
  hero_subtitle_vi: text(500),
  hero_subtitle_en: text(500),
  team_image_path: z.string().max(500).nullable(),
  team_caption_vi: text(300),
  team_caption_en: text(300),
  shipping_fee: money,
  free_shipping_threshold: money,
  facebook: optionalUrl,
  instagram: optionalUrl,
  zalo: optionalUrl,
  youtube: optionalUrl,
});
export type SettingsInput = z.input<typeof settingsSchema>;
