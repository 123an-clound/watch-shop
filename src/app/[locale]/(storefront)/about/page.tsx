import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StaticPage, staticPageMetadata } from "@/components/storefront/static-page";
import { getSettings } from "@/features/settings/queries";
import { pick } from "@/lib/i18n-utils";
import { publicImageUrl, SITE_BUCKET } from "@/lib/images";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return staticPageMetadata(locale, "about");
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations("Pages.about"), getSettings()]);
  const caption = pick(settings, "team_caption", locale);
  const stories = t.raw("stories") as { title: string; body: string }[];

  return (
    <StaticPage pageKey="about">
      {/* Shown only once a real team photo has been uploaded in Admin → Settings. */}
      {settings.team_image_path && (
        <section className="mt-14">
          <h2 className="text-2xl">{t("teamTitle")}</h2>
          <figure className="mt-4">
            <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-muted">
              <Image
                src={publicImageUrl(settings.team_image_path, SITE_BUCKET)}
                alt={caption || t("teamTitle")}
                fill
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-cover"
              />
            </div>
            {caption && (
              <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>
            )}
          </figure>
        </section>
      )}
      <section className="mt-14">
        <h2 className="text-2xl">{t("storiesTitle")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("demoNote")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {stories.map((s) => (
            <article key={s.title} className="rounded-lg border bg-card p-5">
              <h3 className="font-sans text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </section>
    </StaticPage>
  );
}
