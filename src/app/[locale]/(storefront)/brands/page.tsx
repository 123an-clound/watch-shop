import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { getBrands } from "@/features/catalog/queries";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/i18n-utils";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/brands">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Products" });
  return pageMetadata({
    locale,
    path: "/brands",
    title: t("brandsIndexTitle"),
    description: t("brandsIndexDescription"),
  });
}

export default async function BrandsPage({ params }: PageProps<"/[locale]/brands">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tb, brands] = await Promise.all([
    getTranslations("Products"),
    getTranslations("Breadcrumb"),
    getBrands(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: tb("brands"), href: "/brands" }]} />
      <h1 className="mt-6 mb-10 text-4xl sm:text-5xl">{t("brandsIndexTitle")}</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <li key={b.id}>
            <Link
              href={`/brands/${b.slug}`}
              className="flex h-full flex-col rounded-lg border bg-card p-6 transition-colors hover:border-primary/60"
            >
              <span className="font-heading text-2xl">{b.name}</span>
              <span className="mt-2 text-sm text-muted-foreground">
                {pick(b, "description", locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
