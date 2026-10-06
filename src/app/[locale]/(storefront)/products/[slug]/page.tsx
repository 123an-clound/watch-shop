import { ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { Price } from "@/components/storefront/price";
import { ProductGrid } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductReviews } from "@/components/storefront/product-reviews";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/features/catalog/queries";
import { displayName, getProductReviews } from "@/features/reviews/queries";
import { getSettings } from "@/features/settings/queries";
import { Link } from "@/i18n/navigation";
import { formatVND } from "@/lib/format";
import { pick } from "@/lib/i18n-utils";
import { publicImageUrl } from "@/lib/images";
import { jsonLd, localeUrl, pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getProductSlugs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const name = pick(product, "name", locale);
  return pageMetadata({
    locale,
    path: `/products/${slug}`,
    title: pick(product, "seo_title", locale) || name,
    description: (
      pick(product, "seo_description", locale) ||
      pick(product, "description", locale) ||
      name
    ).slice(0, 160),
  });
}

export default async function ProductPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, tb, tFeatures, settings, related, reviews] = await Promise.all([
    getTranslations("Product"),
    getTranslations("Breadcrumb"),
    getTranslations("Features"),
    getSettings(),
    getRelatedProducts(product.id, product.category_id, 4),
    getProductReviews(product.id),
  ]);

  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale);
  const categoryName = product.category ? pick(product.category, "name", locale) : null;
  const images = product.images.map((img) => ({
    path: img.storage_path,
    alt: (locale === "en" ? img.alt_en : img.alt_vi) || name,
    width: img.width,
    height: img.height,
  }));
  const label = (key: string) => (tFeatures.has(key) ? tFeatures(key) : key.replace(/_/g, " "));
  const value = (v: string) => (tFeatures.has(`values.${v}`) ? tFeatures(`values.${v}`) : v);
  // jsonb does not preserve key order; show the common specs first.
  const SPEC_ORDER = [
    "movement",
    "case_size",
    "case_material",
    "water_resistance",
    "crystal",
    "strap_material",
  ];
  const rank = (k: string) => (SPEC_ORDER.includes(k) ? SPEC_ORDER.indexOf(k) : SPEC_ORDER.length);
  const features = Object.entries(product.features)
    .filter(([, v]) => typeof v === "string" && v)
    .sort(([a], [b]) => rank(a) - rank(b));
  const savings =
    product.compare_at_price && product.compare_at_price > product.price
      ? product.compare_at_price - product.price
      : 0;
  const stockLabel =
    product.stock <= 0
      ? t("outOfStock")
      : product.stock <= 3
        ? t("lowStock", { count: product.stock })
        : t("inStock");

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: product.sku,
    description: description || name,
    image: images.map((i) => publicImageUrl(i.path)),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    offers: {
      "@type": "Offer",
      url: localeUrl(locale, `/products/${slug}`),
      priceCurrency: "VND",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: settings.store_name },
    },
    // Only real, approved reviews are ever emitted.
    ...(reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.average,
            reviewCount: reviews.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.items
            .filter((r) => !r.is_demo)
            .slice(0, 5)
            .map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: displayName(r.author_name) },
              datePublished: r.created_at.slice(0, 10),
              reviewBody: r.body,
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating,
                bestRating: 5,
                worstRating: 1,
              },
            })),
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: tb("products"), href: "/products" },
          ...(product.category && categoryName
            ? [{ name: categoryName, href: `/categories/${product.category.slug}` }]
            : []),
          { name, href: `/products/${slug}` },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={images} name={name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand && (
              <Link href={`/brands/${product.brand.slug}`} className="eyebrow hover:underline">
                {product.brand.name}
              </Link>
            )}
            <h1 className="mt-3 text-3xl sm:text-4xl">{name}</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {t("sku")}: {product.sku}
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <Price
              price={product.price}
              compareAt={product.compare_at_price}
              className="text-2xl"
            />
            {savings > 0 && (
              <span className="rounded-sm bg-primary/15 px-2 py-0.5 text-sm text-primary">
                {t("save", { amount: formatVND(savings) })}
              </span>
            )}
          </div>

          <p
            className={
              product.stock > 0 ? "text-sm text-success" : "text-sm font-medium text-destructive"
            }
          >
            {stockLabel}
          </p>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <AddToCart
                item={{
                  productId: product.id,
                  slug: product.slug,
                  nameVi: product.name_vi,
                  nameEn: product.name_en,
                  price: product.price,
                  imagePath: images[0]?.path ?? null,
                  stock: product.stock,
                }}
              />
            </div>
            <WishlistButton productId={product.id} slug={product.slug} />
          </div>

          <p className="flex items-center gap-2 border-y py-4 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-4 shrink-0 text-primary" aria-hidden />
            {t("perks")}
          </p>

          {description && (
            <section aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="mb-3 text-xl">
                {t("description")}
              </h2>
              <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                {description}
              </p>
            </section>
          )}

          {features.length > 0 && (
            <section aria-labelledby="specs-heading">
              <h2 id="specs-heading" className="mb-3 text-xl">
                {t("specs")}
              </h2>
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {product.brand && (
                    <tr>
                      <th
                        scope="row"
                        className="py-2.5 pr-4 text-left font-normal text-muted-foreground"
                      >
                        {t("brand")}
                      </th>
                      <td className="py-2.5">{product.brand.name}</td>
                    </tr>
                  )}
                  {features.map(([key, v]) => (
                    <tr key={key}>
                      <th
                        scope="row"
                        className="py-2.5 pr-4 text-left font-normal text-muted-foreground first-letter:uppercase"
                      >
                        {label(key)}
                      </th>
                      <td className="py-2.5">{value(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} slug={product.slug} reviews={reviews} />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <h2 id="related-heading" className="mb-8 text-3xl">
            {t("related")}
          </h2>
          <ProductGrid products={related} />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productJsonLd)} />
    </div>
  );
}
