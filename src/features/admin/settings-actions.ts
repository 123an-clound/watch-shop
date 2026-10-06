"use server";

import { updateTag } from "next/cache";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { SITE_BUCKET } from "@/lib/images";
import { logServerError } from "@/lib/server-log";
import { getAdmin } from "./auth";
import { settingsSchema, type SettingsInput } from "./settings-schemas";

const uploadedPath = /^[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif)$/;

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  const { facebook, instagram, zalo, youtube, ...rest } = parsed.data;
  const social = Object.fromEntries(
    Object.entries({ facebook, instagram, zalo, youtube }).filter(([, v]) => v),
  );

  try {
    const { data: current } = await admin.supabase
      .from("lw_site_settings")
      .select("hero_image_path, team_image_path")
      .eq("id", 1)
      .single();
    const { error } = await admin.supabase
      .from("lw_site_settings")
      .update({
        ...rest,
        contact_email: rest.contact_email || null,
        contact_phone: rest.contact_phone || null,
        address: rest.address || null,
        hero_title_vi: rest.hero_title_vi || null,
        hero_title_en: rest.hero_title_en || null,
        hero_subtitle_vi: rest.hero_subtitle_vi || null,
        hero_subtitle_en: rest.hero_subtitle_en || null,
        team_caption_vi: rest.team_caption_vi || null,
        team_caption_en: rest.team_caption_en || null,
        social_links: social,
      })
      .eq("id", 1);
    if (error) throw error;

    // Remove previous hero/team files that were replaced (only our own uploads).
    const replaced = [
      [current?.hero_image_path, rest.hero_image_path],
      [current?.team_image_path, rest.team_image_path],
    ]
      .filter(([before, after]) => before && before !== after && uploadedPath.test(before))
      .map(([before]) => before as string);
    if (replaced.length) {
      const { error: removeError } = await admin.supabase.storage
        .from(SITE_BUCKET)
        .remove(replaced);
      if (removeError) logServerError("settings.removeImages", removeError);
    }
    updateTag("settings");
    return ok(undefined);
  } catch (e) {
    logServerError("admin.saveSettings", e);
    return fail("generic");
  }
}
