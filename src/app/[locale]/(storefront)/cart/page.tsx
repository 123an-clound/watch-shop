import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/storefront/cart-view";
import { getSettings } from "@/features/settings/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });
  return pageMetadata({
    locale,
    path: "/cart",
    title: t("pageTitle"),
    description: t("metaDescription"),
    noIndex: true,
  });
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations("Cart"), getSettings()]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl">{t("pageTitle")}</h1>
      <CartView
        shippingFee={settings.shipping_fee}
        freeShippingThreshold={settings.free_shipping_threshold}
      />
    </div>
  );
}
