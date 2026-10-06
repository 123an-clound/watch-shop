import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { ProductListing } from "@/components/storefront/product-listing";
import { parseFilters } from "@/features/catalog/filters";
import { getBrandBySlug } from "@/features/catalog/queries";
import { pick } from "@/lib/i18n-utils";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/brands/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  const t = await getTranslations({ locale, namespace: "Products" });
  return pageMetadata({
    locale,
    path: `/brands/${slug}`,
    title: t("brandTitle", { brand: brand.name }),
    description: pick(brand, "description", locale) || t("brandDescription", { brand: brand.name }),
  });
}

export default async function BrandPage({
  params,
  searchParams,
}: PageProps<"/[locale]/brands/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();
  const [t, tb] = await Promise.all([getTranslations("Products"), getTranslations("Breadcrumb")]);
  const fixed = { brand: slug };
  const { filters, price } = parseFilters(await searchParams, fixed);

  return (
    <ProductListing
      basePath={`/brands/${slug}`}
      filters={filters}
      price={price}
      fixed={fixed}
      heading={t("brandTitle", { brand: brand.name })}
      intro={pick(brand, "description", locale) || undefined}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { name: tb("brands"), href: "/brands" },
            { name: brand.name, href: `/brands/${slug}` },
          ]}
        />
      }
    />
  );
}
