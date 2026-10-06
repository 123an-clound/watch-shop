import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Providers } from "@/components/shared/providers";
import { getSettings } from "@/features/settings/queries";
import { pickMessages, STOREFRONT_CLIENT_NAMESPACES } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { ogLocale, SITE_URL } from "@/lib/seo";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
    { media: "(prefers-color-scheme: light)", color: "#fbf9f4" },
  ],
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getSettings(),
  ]);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.store_name,
      template: `%s | ${settings.store_name}`,
    },
    description: t("description"),
    applicationName: settings.store_name,
    openGraph: {
      siteName: settings.store_name,
      locale: ogLocale(locale),
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, messages] = await Promise.all([getTranslations("Common"), getMessages()]);

  return (
    <html
      lang={locale}
      className={`${fontDisplay.variable} ${fontBody.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={pickMessages(messages, STOREFRONT_CLIENT_NAMESPACES)}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
