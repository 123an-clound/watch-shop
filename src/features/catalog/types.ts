import type { Tables } from "@/types/database.types";

export type Category = Pick<
  Tables<"lw_categories">,
  "id" | "slug" | "name_vi" | "name_en" | "parent_id" | "sort_order" | "updated_at"
>;

export type Brand = Pick<
  Tables<"lw_brands">,
  "id" | "slug" | "name" | "logo_url" | "description_vi" | "description_en" | "updated_at"
>;

export type ProductImage = Pick<
  Tables<"lw_product_images">,
  "storage_path" | "alt_vi" | "alt_en" | "width" | "height" | "sort_order"
>;

export type ProductCard = Pick<
  Tables<"lw_products">,
  "id" | "slug" | "name_vi" | "name_en" | "price" | "compare_at_price" | "stock" | "created_at"
> & {
  brand: { name: string; slug: string } | null;
  image: ProductImage | null;
};

export type ProductDetail = Pick<
  Tables<"lw_products">,
  | "id"
  | "slug"
  | "sku"
  | "name_vi"
  | "name_en"
  | "description_vi"
  | "description_en"
  | "price"
  | "compare_at_price"
  | "stock"
  | "category_id"
  | "seo_title_vi"
  | "seo_title_en"
  | "seo_description_vi"
  | "seo_description_en"
  | "updated_at"
> & {
  features: Record<string, string>;
  brand: { name: string; slug: string } | null;
  category: { slug: string; name_vi: string; name_en: string } | null;
  images: ProductImage[];
};

export const SORTS = ["newest", "price_asc", "price_desc"] as const;
export type Sort = (typeof SORTS)[number];

export type ProductFilters = {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  movement: string[];
  caseSize: string[];
  sort: Sort;
  page: number;
};
