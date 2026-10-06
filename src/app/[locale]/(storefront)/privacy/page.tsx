import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { StaticPage, staticPageMetadata } from "@/components/storefront/static-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "privacy");
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaticPage pageKey="privacy" />;
}
