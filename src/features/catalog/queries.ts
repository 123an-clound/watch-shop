import "server-only";
import { unstable_cache } from "next/cache";
import { unaccent } from "@/lib/search";
import { CACHE_NS } from "@/lib/cache";
import { DataError } from "@/lib/server-log";
import { createPublicClient } from "@/lib/supabase/server";
import type {
  Brand,
  Category,
  ProductCard,
  ProductDetail,
  ProductFilters,
  ProductImage,
} from "./types";

export const PAGE_SIZE = 12;

const CARD_COLUMNS =
  "id, slug, name_vi, name_en, price, compare_at_price, stock, created_at, " +
  "images:lw_product_images(storage_path, alt_vi, alt_en, width, height, sort_order)";

type CardRow = Omit<ProductCard, "image" | "brand"> & {
  images: ProductImage[] | null;
  brand: { name: string; slug: string } | null;
};

function toCard(row: CardRow): ProductCard {
  const { images, ...rest } = row;
  const sorted = [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return { ...rest, image: sorted[0] ?? null };
}

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await createPublicClient()
      .from("lw_categories")
      .select("id, slug, name_vi, name_en, parent_id, sort_order, updated_at")
      .order("sort_order")
      .order("name_vi");
    if (error) throw new DataError("categories", error);
    return data;
  },
  ["categories", CACHE_NS],
  { tags: ["categories"] },
);

export const getBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    const { data, error } = await createPublicClient()
      .from("lw_brands")
      .select("id, slug, name, logo_url, description_vi, description_en, updated_at")
      .order("name");
    if (error) throw new DataError("brands", error);
    return data;
  },
  ["brands", CACHE_NS],
  { tags: ["brands"] },
);

export async function getCategoryBySlug(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getBrandBySlug(slug: string) {
  return (await getBrands()).find((b) => b.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const listProducts = unstable_cache(
  async (filters: ProductFilters): Promise<{ items: ProductCard[]; total: number }> => {
    const brandJoin = filters.brand ? "lw_brands!inner" : "lw_brands";
    const categoryJoin = filters.category ? "lw_categories!inner" : "lw_categories";

    let query = createPublicClient()
      .from("lw_products")
      .select(`${CARD_COLUMNS}, brand:${brandJoin}(name, slug), category:${categoryJoin}(slug)`, {
        count: "exact",
      })
      .eq("is_active", true);

    if (filters.brand) query = query.eq("brand.slug", filters.brand);
    if (filters.category) query = query.eq("category.slug", filters.category);
    if (filters.q) {
      query = query.textSearch("search_vector", unaccent(filters.q), {
        type: "websearch",
        config: "simple",
      });
    }
    if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
    if (filters.movement.length) query = query.in("features->>movement", filters.movement);
    if (filters.caseSize.length) query = query.in("features->>case_size", filters.caseSize);

    if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
    else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    query = query.order("id");

    const from = (filters.page - 1) * PAGE_SIZE;
    const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw new DataError("products", error);

    return {
      items: (data as unknown as CardRow[]).map(toCard),
      total: count ?? 0,
    };
  },
  ["products-list", CACHE_NS],
  { tags: ["products"] },
);

export const getFeaturedProducts = unstable_cache(
  async (limit: number): Promise<ProductCard[]> => {
    const { data, error } = await createPublicClient()
      .from("lw_products")
      .select(`${CARD_COLUMNS}, brand:lw_brands(name, slug)`)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new DataError("featured products", error);
    return (data as unknown as CardRow[]).map(toCard);
  },
  ["products-featured", CACHE_NS],
  { tags: ["products"] },
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, categoryId: string | null, limit: number): Promise<ProductCard[]> => {
    let query = createPublicClient()
      .from("lw_products")
      .select(`${CARD_COLUMNS}, brand:lw_brands(name, slug)`)
      .eq("is_active", true)
      .neq("id", productId);
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query.order("is_featured", { ascending: false }).limit(limit);
    if (error) throw new DataError("related products", error);
    return (data as unknown as CardRow[]).map(toCard);
  },
  ["products-related", CACHE_NS],
  { tags: ["products"] },
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const { data, error } = await createPublicClient()
      .from("lw_products")
      .select(
        "id, slug, sku, name_vi, name_en, description_vi, description_en, price, compare_at_price, " +
          "stock, features, category_id, seo_title_vi, seo_title_en, seo_description_vi, " +
          "seo_description_en, updated_at, " +
          "brand:lw_brands(name, slug), category:lw_categories(slug, name_vi, name_en), " +
          "images:lw_product_images(storage_path, alt_vi, alt_en, width, height, sort_order)",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new DataError("product", error);
    if (!data) return null;
    const row = data as unknown as ProductDetail;
    return {
      ...row,
      images: [...row.images].sort((a, b) => a.sort_order - b.sort_order),
    };
  },
  ["product-by-slug", CACHE_NS],
  { tags: ["products"] },
);

/** Slugs + timestamps for generateStaticParams and the sitemap. */
export const getProductSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const { data, error } = await createPublicClient()
      .from("lw_products")
      .select("slug, updated_at")
      .eq("is_active", true);
    if (error) throw new DataError("product slugs", error);
    return data;
  },
  ["product-slugs", CACHE_NS],
  { tags: ["products"] },
);

/** Distinct feature values for listing filters. */
export const getFeatureFacets = unstable_cache(
  async (): Promise<{ movement: string[]; caseSize: string[] }> => {
    const { data, error } = await createPublicClient()
      .from("lw_products")
      .select("features")
      .eq("is_active", true);
    if (error) throw new DataError("feature facets", error);
    const movement = new Set<string>();
    const caseSize = new Set<string>();
    for (const { features } of data) {
      const f = features as Record<string, unknown>;
      if (typeof f.movement === "string") movement.add(f.movement);
      if (typeof f.case_size === "string") caseSize.add(f.case_size);
    }
    const byNumber = (a: string, b: string) => parseFloat(a) - parseFloat(b);
    return {
      movement: [...movement].sort(),
      caseSize: [...caseSize].sort(byNumber),
    };
  },
  ["feature-facets", CACHE_NS],
  { tags: ["products"] },
);
