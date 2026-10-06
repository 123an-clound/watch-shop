/** Strip Vietnamese diacritics so queries match the unaccented search_vector. */
export function unaccent(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

/** Vietnamese-safe slug: "Đồng hồ Nam" → "dong-ho-nam". */
export function slugify(value: string) {
  return unaccent(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
