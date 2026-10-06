import { getLocale, getTranslations } from "next-intl/server";
import { getCategories } from "@/features/catalog/queries";
import { getSettings } from "@/features/settings/queries";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/i18n-utils";

export async function Footer() {
  const [t, tNav, locale, settings, categories] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Nav"),
    getLocale(),
    getSettings(),
    getCategories(),
  ]);
  const social = settings.social_links as Record<string, string>;
  const link = "text-sm text-muted-foreground transition-colors hover:text-foreground";

  return (
    <footer className="mt-24 border-t bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-heading text-2xl">{settings.store_name}</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>
          <address className="mt-4 space-y-1 text-sm text-muted-foreground not-italic">
            {settings.address && <p>{settings.address}</p>}
            {settings.contact_phone && (
              <p>
                <a href={`tel:${settings.contact_phone}`} className="hover:text-foreground">
                  {settings.contact_phone}
                </a>
              </p>
            )}
            {settings.contact_email && (
              <p>
                <a href={`mailto:${settings.contact_email}`} className="hover:text-foreground">
                  {settings.contact_email}
                </a>
              </p>
            )}
          </address>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="eyebrow mb-4 font-sans">
            {t("shop")}
          </h2>
          <ul className="space-y-2">
            <li>
              <Link href="/products" className={link}>
                {tNav("allWatches")}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className={link}>
                  {pick(c, "name", locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-support">
          <h2 id="footer-support" className="eyebrow mb-4 font-sans">
            {t("support")}
          </h2>
          <ul className="space-y-2">
            <li>
              <Link href="/track-order" className={link}>
                {t("trackOrder")}
              </Link>
            </li>
            <li>
              <Link href="/warranty" className={link}>
                {t("warranty")}
              </Link>
            </li>
            <li>
              <Link href="/shipping" className={link}>
                {t("shipping")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className={link}>
                {t("faq")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={link}>
                {t("privacy")}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className="eyebrow mb-4 font-sans">
            {t("company")}
          </h2>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className={link}>
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={link}>
                {t("contact")}
              </Link>
            </li>
            {Object.entries(social).map(([name, url]) => (
              <li key={name}>
                <a
                  href={url}
                  className={`${link} capitalize`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>
            {t("rights", {
              year: new Date().getFullYear(),
              store: settings.store_name,
            })}
          </p>
          <p>{t("paymentNote")}</p>
        </div>
      </div>
    </footer>
  );
}
