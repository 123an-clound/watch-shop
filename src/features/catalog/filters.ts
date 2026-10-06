import { z } from "zod";
import { type ProductFilters, SORTS } from "./types";

export const PRICE_RANGES = {
  lt10: [undefined, 10_000_000],
  "10-50": [10_000_000, 50_000_000],
  "50-150": [50_000_000, 150_000_000],
  gt150: [150_000_000, undefined],
} as const satisfies Record<string, readonly [number | undefined, number | undefined]>;
export type PriceKey = keyof typeof PRICE_RANGES;

const list = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : [v]).map((s) => s.slice(0, 40)).slice(0, 10))
  .optional()
  .catch(undefined);

const schema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().max(80).optional().catch(undefined),
  brand: z.string().max(80).optional().catch(undefined),
  price: z
    .enum(Object.keys(PRICE_RANGES) as [PriceKey, ...PriceKey[]])
    .optional()
    .catch(undefined),
  movement: list,
  size: list,
  sort: z.enum(SORTS).catch("newest"),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Parse listing search params (all optional, invalid values ignored). */
export function parseFilters(raw: RawParams, fixed: { category?: string; brand?: string } = {}) {
  const parsed = schema.parse({
    q: first(raw.q),
    category: first(raw.category),
    brand: first(raw.brand),
    price: first(raw.price),
    movement: raw.movement || undefined,
    size: raw.size || undefined,
    sort: first(raw.sort),
    page: first(raw.page),
  });
  const [minPrice, maxPrice] = parsed.price ? PRICE_RANGES[parsed.price] : [undefined, undefined];

  const filters: ProductFilters = {
    q: parsed.q || undefined,
    category: fixed.category ?? parsed.category,
    brand: fixed.brand ?? parsed.brand,
    minPrice,
    maxPrice,
    movement: parsed.movement ?? [],
    caseSize: parsed.size ?? [],
    sort: parsed.sort,
    page: parsed.page,
  };
  const hasParams = Object.values(raw).some((v) => v !== undefined && v !== "");
  return { filters, price: parsed.price, hasParams };
}

/** Rebuild a query string from filters (for pagination links). */
export function filtersToQuery(
  filters: ProductFilters,
  price: PriceKey | undefined,
  fixed: { category?: string; brand?: string } = {},
  page?: number,
) {
  const qs = new URLSearchParams();
  if (filters.q) qs.set("q", filters.q);
  if (filters.category && !fixed.category) qs.set("category", filters.category);
  if (filters.brand && !fixed.brand) qs.set("brand", filters.brand);
  if (price) qs.set("price", price);
  filters.movement.forEach((m) => qs.append("movement", m));
  filters.caseSize.forEach((s) => qs.append("size", s));
  if (filters.sort !== "newest") qs.set("sort", filters.sort);
  if (page && page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
