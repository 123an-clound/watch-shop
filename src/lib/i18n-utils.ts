import type { Locale } from "@/i18n/routing";

type Bilingual<K extends string> = {
  [P in `${K}_vi` | `${K}_en`]: string | null;
};

/** Pick the `<key>_vi` / `<key>_en` field for the locale, falling back to Vietnamese. */
export function pick<K extends string>(row: Bilingual<K>, key: K, locale: Locale | string) {
  const en = row[`${key}_en` as `${K}_en`];
  const vi = row[`${key}_vi` as `${K}_vi`];
  return (locale === "en" ? en || vi : vi || en) ?? "";
}
