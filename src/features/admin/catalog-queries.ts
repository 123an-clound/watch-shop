import "server-only";
import { DataError } from "@/lib/server-log";
import { requireAdminPage } from "./auth";

export const ADMIN_PAGE_SIZE = 20;

export type AdminProductFilters = {
  q?: string;
  category?: string;
  brand?: string;
  status?: "active" | "inactive" | "low";
  sort: "newest" | "name" | "price_asc" | "price_desc" | "stock";
  page: number;
};

export async function adminListCategories() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("lw_categories")
    .select("id, slug, name_vi, name_en, parent_id, sort_order, products:lw_products(count)")
    .order("sort_order")
    .order("name_vi");
  if (error) throw new DataError("admin categories", error);
  return data.map(({ products, ...c }) => ({ ...c, productCount: products[0]?.count ?? 0 }));
}

export async function adminListBrands() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("lw_brands")
    .select("id, slug, name, logo_url, description_vi, description_en, products:lw_products(count)")
    .order("name");
  if (error) throw new DataError("admin brands", error);
  return data.map(({ products, ...b }) => ({ ...b, productCount: products[0]?.count ?? 0 }));
}

export async function adminListProducts(filters: AdminProductFilters) {
  const { supabase } = await requireAdminPage();
  let query = supabase
    .from("lw_products")
    .select(
      "id, slug, sku, name_vi, price, compare_at_price, stock, is_active, is_featured, updated_at, " +
        "category:lw_categories(name_vi), brand:lw_brands(name), " +
        "images:lw_product_images(storage_path, sort_order)",
      { count: "exact" },
    );

  if (filters.q) {
    const q = filters.q.replace(/[%_,()]/g, " ").trim();
    if (q) query = query.or(`name_vi.ilike.%${q}%,name_en.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.brand) query = query.eq("brand_id", filters.brand);
  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);
  if (filters.status === "low") query = query.lte("stock", 3);

  const sorts = {
    newest: ["created_at", false],
    name: ["name_vi", true],
    price_asc: ["price", true],
    price_desc: ["price", false],
    stock: ["stock", true],
  } as const;
  const [column, ascending] = sorts[filters.sort];
  query = query.order(column, { ascending }).order("id");

  const from = (filters.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw new DataError("admin products", error);

  type Row = {
    id: string;
    slug: string;
    sku: string;
    name_vi: string;
    price: number;
    compare_at_price: number | null;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    updated_at: string;
    category: { name_vi: string } | null;
    brand: { name: string } | null;
    images: { storage_path: string; sort_order: number }[];
  };
  const items = (data as unknown as Row[]).map(({ images, ...p }) => ({
    ...p,
    imagePath: [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null,
  }));
  return { items, total: count ?? 0 };
}

export async function adminGetProduct(id: string) {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("lw_products")
    .select(
      "id, slug, sku, name_vi, name_en, description_vi, description_en, price, compare_at_price, " +
        "stock, category_id, brand_id, features, is_featured, is_active, seo_title_vi, seo_title_en, " +
        "seo_description_vi, seo_description_en, " +
        "images:lw_product_images(storage_path, alt_vi, alt_en, width, height, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new DataError("admin product", error);
  return data as unknown as AdminProduct | null;
}

export type AdminProduct = {
  id: string;
  slug: string;
  sku: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  category_id: string | null;
  brand_id: string | null;
  features: Record<string, string>;
  is_featured: boolean;
  is_active: boolean;
  seo_title_vi: string | null;
  seo_title_en: string | null;
  seo_description_vi: string | null;
  seo_description_en: string | null;
  images: {
    storage_path: string;
    alt_vi: string | null;
    alt_en: string | null;
    width: number;
    height: number;
    sort_order: number;
  }[];
};
