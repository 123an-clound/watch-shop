import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { staticPageMetadata } from "@/components/storefront/static-page";
import { getSettings } from "@/features/settings/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "contact");
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations("Pages.contact"), getSettings()]);
  const items = [
    settings.contact_phone && {
      icon: PhoneIcon,
      label: t("phone"),
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone}`,
    },
    settings.contact_email && {
      icon: MailIcon,
      label: t("email"),
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    },
    settings.address && { icon: MapPinIcon, label: t("address"), value: settings.address },
    { icon: ClockIcon, label: t("hours"), value: t("hoursValue") },
  ].filter(Boolean) as { icon: typeof PhoneIcon; label: string; value: string; href?: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6">
      <Breadcrumbs items={[{ name: t("title"), href: "/contact" }]} />
      <h1 className="mt-6 text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("intro")}</p>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex gap-4 rounded-lg border bg-card p-5">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              {href ? (
                <a href={href} className="font-medium hover:text-primary">
                  {value}
                </a>
              ) : (
                <p className="font-medium">{value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
