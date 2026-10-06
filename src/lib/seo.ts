import type { Metadata } from "next";
import { env } from "@/env";
import { routing } from "@/i18n/routing";

export const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Absolute URL for a locale + path ("/products" → "https://site/vi/products"). */
export function localeUrl(locale: string, path = "") {
  const clean = path === "/" ? "" : path;
  return `${SITE_URL}/${locale}${clean}`;
}

/** Canonical + hreflang alternates (incl. x-default → default locale). */
export function alternates(locale: string, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, path);
  languages["x-default"] = localeUrl(routing.defaultLocale, path);
  return { canonical: localeUrl(locale, path), languages };
}

export function ogLocale(locale: string) {
  return locale === "en" ? "en_US" : "vi_VN";
}

/** Shared page metadata: title, description, canonical/hreflang, OG + Twitter. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images,
  noIndex,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  images?: string[];
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title,
      description,
      url: localeUrl(locale, path),
      locale: ogLocale(locale),
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Serialize JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
