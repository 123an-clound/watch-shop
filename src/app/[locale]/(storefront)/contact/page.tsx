import { ClockIcon, MailIcon, MapPinIcon, NavigationIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { staticPageMetadata } from "@/components/storefront/static-page";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/features/settings/queries";
import { jsonLd, localeUrl, SITE_URL } from "@/lib/seo";

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
  const directionsUrl = settings.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: settings.store_name,
    url: localeUrl(locale),
    image: `${SITE_URL}/${locale}/opengraph-image`,
    ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "VN",
          },
        }
      : {}),
    ...(directionsUrl ? { hasMap: directionsUrl } : {}),
    // Matches the opening hours shown on this page (Pages.contact.hoursValue).
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "21:00",
    },
    paymentAccepted: "Cash",
    currenciesAccepted: "VND",
  };

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
      {directionsUrl && (
        <Button variant="outline" size="lg" className="mt-6" asChild>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <NavigationIcon aria-hidden />
            {t("directions")}
          </a>
        </Button>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(localBusiness)} />
    </div>
  );
}
