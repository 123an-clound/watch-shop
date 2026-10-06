import type { MetadataRoute } from "next";
import { getBrands, getCategories, getProductSlugs } from "@/features/catalog/queries";
import { routing } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo";

type Entry = MetadataRoute.Sitemap[number];

function entry(path: string, lastModified?: string, priority = 0.6): Entry {
  return {
    url: localeUrl(routing.defaultLocale, path),
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)])),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    getProductSlugs(),
    getCategories(),
    getBrands(),
  ]);

  const pages: Entry[] = [
    entry("", undefined, 1),
    entry("/products", undefined, 0.9),
    entry("/brands", undefined, 0.7),
    ...["/about", "/warranty", "/shipping", "/contact"].map((p) => entry(p, undefined, 0.3)),
    ...categories.map((c) => entry(`/categories/${c.slug}`, c.updated_at, 0.8)),
    ...brands.map((b) => entry(`/brands/${b.slug}`, b.updated_at, 0.8)),
    ...products.map((p) => entry(`/products/${p.slug}`, p.updated_at, 0.7)),
  ];

  // One URL per locale, each listing its hreflang alternates.
  return routing.locales.flatMap((locale) =>
    pages.map((p) => ({ ...p, url: p.url.replace(`/${routing.defaultLocale}`, `/${locale}`) })),
  );
}
