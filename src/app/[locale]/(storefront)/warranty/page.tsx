import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { StaticPage, staticPageMetadata } from "@/components/storefront/static-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/warranty">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "warranty");
}

export default async function Page({ params }: PageProps<"/[locale]/warranty">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaticPage pageKey="warranty" />;
}
