import { ChevronDownIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { jsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.faq" });
  return pageMetadata({ locale, path: "/faq", title: t("title"), description: t("description") });
}

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pages.faq");
  const items = t.raw("items") as { q: string; a: string }[];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6">
      <Breadcrumbs items={[{ name: t("title"), href: "/faq" }]} />
      <h1 className="mt-6 text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      <div className="mt-10 divide-y border-y">
        {items.map((i) => (
          <details key={i.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
              <h2 className="font-sans text-lg font-medium">{i.q}</h2>
              <ChevronDownIcon
                className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">{i.a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd)} />
    </div>
  );
}
