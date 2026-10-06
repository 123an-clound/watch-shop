import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Stars } from "@/components/shared/stars";
import { ProductGrid } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { getBrands, getCategories, getFeaturedProducts } from "@/features/catalog/queries";
import { displayName, getLatestReviews } from "@/features/reviews/queries";
import { getSettings } from "@/features/settings/queries";
import { Link } from "@/i18n/navigation";
import { formatVND } from "@/lib/format";
import { pick } from "@/lib/i18n-utils";
import { publicImageUrl, SITE_BUCKET } from "@/lib/images";
import { jsonLd, localeUrl, pageMetadata, SITE_URL } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const [t, tMeta, settings] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Metadata" }),
    getSettings(),
  ]);
  return {
    ...pageMetadata({ locale, path: "", title: t("metaTitle"), description: tMeta("description") }),
    title: { absolute: `${settings.store_name} — ${t("metaTitle")}` },
  };
}

function SectionHeading({
  eyebrow,
  title,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && cta && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {cta}
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tc, tReviews, settings, featured, brands, categories, reviews] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Common"),
    getTranslations("Reviews"),
    getSettings(),
    getFeaturedProducts(8),
    getBrands(),
    getCategories(),
    getLatestReviews(3),
  ]);

  const heroTitle = pick(settings, "hero_title", locale);
  const heroSubtitle = pick(settings, "hero_subtitle", locale);
  const trust = [
    { icon: BadgeCheckIcon, title: t("trustAuthentic"), body: t("trustAuthenticBody") },
    { icon: ShieldCheckIcon, title: t("trustWarranty"), body: t("trustWarrantyBody") },
    { icon: BanknoteIcon, title: t("trustCod"), body: t("trustCodBody") },
    {
      icon: TruckIcon,
      title: t("trustShipping"),
      body: t("trustShippingBody", { amount: formatVND(settings.free_shipping_threshold) }),
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.store_name,
      url: SITE_URL,
      ...(settings.contact_email ? { email: settings.contact_email } : {}),
      ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
      ...(settings.address ? { address: settings.address } : {}),
      sameAs: Object.values(settings.social_links as Record<string, string>),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.store_name,
      url: localeUrl(locale),
      inLanguage: locale,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${localeUrl(locale, "/products")}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        {settings.hero_image_path && (
          <Image
            src={publicImageUrl(settings.hero_image_path, SITE_BUCKET)}
            alt=""
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className="-z-10 object-cover"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/80 to-background/10" />
        <div className="mx-auto flex min-h-[78svh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
          <p className="eyebrow">{settings.store_name}</p>
          <h1 className="mt-5 max-w-2xl text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{heroSubtitle}</p>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/products">{t("heroCta")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/brands">{t("heroSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-label={t("trustAuthentic")} className="border-y bg-card/40">
        <ul className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trust.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("featuredEyebrow")}
            title={t("featuredTitle")}
            href="/products"
            cta={tc("viewAll")}
          />
          <ProductGrid products={featured} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("brandsEyebrow")}
          title={t("brandsTitle")}
          href="/brands"
          cta={tc("viewAll")}
        />
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={`/brands/${b.slug}`}
                className="flex h-28 items-center justify-center bg-background px-4 text-center font-heading text-xl transition-colors hover:bg-accent hover:text-primary"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                className="group flex aspect-[4/3] flex-col justify-end rounded-lg border bg-gradient-to-br from-card to-accent p-6 transition-colors hover:border-primary/60"
              >
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <span className="mt-2 font-heading text-2xl group-hover:text-primary">
                  {pick(c, "name", locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Real, approved customer reviews only — hidden until there are some. */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow={tReviews("homeEyebrow")} title={tReviews("homeTitle")} />
          <ul className="grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <figure className="flex h-full flex-col rounded-lg border bg-card p-6">
                  <Stars rating={r.rating} label={tReviews("stars", { count: r.rating })} />
                  <blockquote className="mt-4 flex-1 leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-4 text-sm text-muted-foreground">
                    {displayName(r.author_name)}
                    {r.is_demo && ` · ${tReviews("demo")}`}
                    {r.product && (
                      <>
                        {" · "}
                        <Link href={`/products/${r.product.slug}`} className="hover:text-primary">
                          {pick(r.product, "name", locale)}
                        </Link>
                      </>
                    )}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="eyebrow">{t("storyEyebrow")}</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">{t("storyTitle")}</h2>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t("storyBody", { store: settings.store_name })}
            </p>
            <Button variant="outline" className="mt-8" asChild>
              <Link href="/about">{t("storyCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
    </>
  );
}
