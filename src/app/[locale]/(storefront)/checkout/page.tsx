import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getAddresses, getProfile } from "@/features/account/queries";
import { getSettings } from "@/features/settings/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return pageMetadata({
    locale,
    path: "/checkout",
    title: t("title"),
    description: t("metaDescription"),
    noIndex: true,
  });
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings, profile, addresses] = await Promise.all([
    getTranslations("Checkout"),
    getSettings(),
    getProfile(),
    getAddresses(),
  ]);
  const address = addresses[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl">{t("title")}</h1>
      <CheckoutForm
        signedIn={Boolean(profile)}
        shippingFee={settings.shipping_fee}
        freeShippingThreshold={settings.free_shipping_threshold}
        prefill={{
          name: address?.recipient_name || profile?.fullName || "",
          phone: address?.phone || profile?.phone || "",
          email: profile?.email ?? "",
          province: address?.province ?? "",
          ward: address?.ward ?? "",
          street: address?.street ?? "",
        }}
      />
    </div>
  );
}
