import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { jsonLd, localeUrl } from "@/lib/seo";

export type Crumb = { name: string; href?: string };

/** Visible breadcrumb trail + BreadcrumbList JSON-LD. Home is prepended automatically. */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const [t, locale] = await Promise.all([getTranslations("Breadcrumb"), getLocale()]);
  const all: Crumb[] = [{ name: t("home"), href: "/" }, ...items];
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: localeUrl(locale, c.href) } : {}),
    })),
  };

  return (
    <>
      <nav aria-label={t("label")} className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
    </>
  );
}
