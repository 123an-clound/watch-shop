import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddressBook } from "@/components/account/address-book";
import { getAddresses } from "@/features/account/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/addresses">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("addresses") };
}

export default async function AddressesPage({ params }: PageProps<"/[locale]/account/addresses">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, addresses] = await Promise.all([getTranslations("Account"), getAddresses()]);

  return (
    <section>
      <h1 className="text-2xl">{t("addresses")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("addressesDescription")}</p>
      <AddressBook addresses={addresses} />
    </section>
  );
}
