import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackOrderForm } from "@/components/storefront/track-order-form";
import { ORDER_CODE_REGEX } from "@/features/orders/schemas";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/track-order">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Track" });
  return pageMetadata({
    locale,
    path: "/track-order",
    title: t("title"),
    description: t("description"),
    noIndex: true,
  });
}

export default async function TrackOrderPage({
  params,
  searchParams,
}: PageProps<"/[locale]/track-order">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Track");
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl">{t("title")}</h1>
      <p className="mt-3 mb-8 text-muted-foreground">{t("description")}</p>
      <TrackOrderForm
        initialCode={typeof code === "string" && ORDER_CODE_REGEX.test(code) ? code : undefined}
      />
    </div>
  );
}
