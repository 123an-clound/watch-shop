import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { ProductListing } from "@/components/storefront/product-listing";
import { parseFilters } from "@/features/catalog/filters";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });
  const { filters } = parseFilters(await searchParams);
  // Canonical always points at the clean listing URL; keyword searches are not indexed.
  return pageMetadata({
    locale,
    path: "/products",
    title: filters.q ? t("searchTitle", { q: filters.q }) : t("title"),
    description: t("description"),
    noIndex: Boolean(filters.q),
  });
}

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tb] = await Promise.all([getTranslations("Products"), getTranslations("Breadcrumb")]);
  const { filters, price } = parseFilters(await searchParams);

  return (
    <ProductListing
      basePath="/products"
      filters={filters}
      price={price}
      heading={filters.q ? t("searchTitle", { q: filters.q }) : t("title")}
      intro={filters.q ? undefined : t("description")}
      breadcrumbs={<Breadcrumbs items={[{ name: tb("products"), href: "/products" }]} />}
    />
  );
}
