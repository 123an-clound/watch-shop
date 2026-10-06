import { getTranslations } from "next-intl/server";
import { getSettings } from "@/features/settings/queries";
import { pick } from "@/lib/i18n-utils";
import { OG_SIZE, renderOg } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [settings, t] = await Promise.all([
    getSettings(),
    getTranslations({ locale, namespace: "Metadata" }),
  ]);

  return renderOg({
    eyebrow: settings.store_name,
    title: pick(settings, "hero_title", locale) || settings.store_name,
    subtitle: undefined,
    footer: t("description"),
  });
}
