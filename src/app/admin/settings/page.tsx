import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdminPage } from "@/features/admin/auth";
import { DataError } from "@/lib/server-log";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.settings");
  return { title: t("title") };
}

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminPage();
  const [t, { data: s, error }] = await Promise.all([
    getTranslations("Admin.settings"),
    supabase.from("lw_site_settings").select("*").eq("id", 1).single(),
  ]);
  if (error) throw new DataError("admin settings", error);
  const social = s.social_links as Record<string, string>;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsForm
        initial={{
          store_name: s.store_name,
          contact_email: s.contact_email ?? "",
          contact_phone: s.contact_phone ?? "",
          address: s.address ?? "",
          hero_image_path: s.hero_image_path,
          hero_title_vi: s.hero_title_vi ?? "",
          hero_title_en: s.hero_title_en ?? "",
          hero_subtitle_vi: s.hero_subtitle_vi ?? "",
          hero_subtitle_en: s.hero_subtitle_en ?? "",
          team_image_path: s.team_image_path,
          team_caption_vi: s.team_caption_vi ?? "",
          team_caption_en: s.team_caption_en ?? "",
          shipping_fee: s.shipping_fee,
          free_shipping_threshold: s.free_shipping_threshold,
          facebook: social.facebook ?? "",
          instagram: social.instagram ?? "",
          zalo: social.zalo ?? "",
          youtube: social.youtube ?? "",
        }}
      />
    </>
  );
}
