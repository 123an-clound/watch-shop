import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { ProductListing } from "@/components/storefront/product-listing";
import { parseFilters } from "@/features/catalog/filters";
import { getCategoryBySlug } from "@/features/catalog/queries";
import { pick } from "@/lib/i18n-utils";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/categories/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const t = await getTranslations({ locale, namespace: "Products" });
  const name = pick(category, "name", locale);
  return pageMetadata({
    locale,
    path: `/categories/${slug}`,
    title: name,
    description: t("categoryDescription", { category: name }),
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const [t, tb] = await Promise.all([getTranslations("Products"), getTranslations("Breadcrumb")]);
  const name = pick(category, "name", locale);
  const fixed = { category: slug };
  const { filters, price } = parseFilters(await searchParams, fixed);

  return (
    <ProductListing
      basePath={`/categories/${slug}`}
      filters={filters}
      price={price}
      fixed={fixed}
      heading={name}
      intro={t("categoryDescription", { category: name })}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { name: tb("products"), href: "/products" },
            { name, href: `/categories/${slug}` },
          ]}
        />
      }
    />
  );
}
