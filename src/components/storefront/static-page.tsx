import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "./breadcrumbs";

export type StaticPageKey = "about" | "warranty" | "shipping" | "privacy";

export async function staticPageMetadata(
  locale: string,
  key: StaticPageKey | "contact",
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `Pages.${key}` });
  return pageMetadata({
    locale,
    path: `/${key}`,
    title: t("title"),
    description: t("description"),
  });
}

/** Content page rendered from `Pages.<key>` messages (title + sections). */
export async function StaticPage({ pageKey }: { pageKey: StaticPageKey }) {
  const t = await getTranslations(`Pages.${pageKey}`);
  const sections = t.raw("sections") as { heading: string; body: string }[];

  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6">
      <Breadcrumbs items={[{ name: t("title"), href: `/${pageKey}` }]} />
      <h1 className="mt-6 text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      <div className="mt-12 grid gap-10">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl">{s.heading}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
