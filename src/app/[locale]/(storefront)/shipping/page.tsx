import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { StaticPage, staticPageMetadata } from "@/components/storefront/static-page";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shipping">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "shipping");
}

export default async function Page({ params }: PageProps<"/[locale]/shipping">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaticPage pageKey="shipping" />;
}
