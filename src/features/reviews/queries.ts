import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_NS } from "@/lib/cache";
import { DataError } from "@/lib/server-log";
import { createPublicClient } from "@/lib/supabase/server";

export type PublicReview = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
};

/** Approved reviews for a product + aggregate (RLS only exposes approved rows to anon). */
export const getProductReviews = unstable_cache(
  async (productId: string) => {
    const { data, error } = await createPublicClient()
      .from("lw_reviews")
      .select("id, author_name, rating, body, created_at")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new DataError("product reviews", error);
    const count = data.length;
    const average = count ? data.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { items: data as PublicReview[], count, average: Math.round(average * 10) / 10 };
  },
  ["product-reviews", CACHE_NS],
  { tags: ["reviews"] },
);

/** Latest approved 4–5★ reviews for the home page. */
export const getLatestReviews = unstable_cache(
  async (limit: number) => {
    const { data, error } = await createPublicClient()
      .from("lw_reviews")
      .select(
        "id, author_name, rating, body, created_at, product:lw_products(slug, name_vi, name_en)",
      )
      .eq("status", "approved")
      .gte("rating", 4)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new DataError("latest reviews", error);
    return data as unknown as (PublicReview & {
      product: { slug: string; name_vi: string; name_en: string } | null;
    })[];
  },
  ["latest-reviews", CACHE_NS],
  { tags: ["reviews"] },
);

/** "Nguyễn Văn An" → "Nguyễn V. A." style privacy-friendly display name. */
export function displayName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return [parts[0], ...parts.slice(1).map((p) => `${p[0]}.`)].join(" ");
}
