import "server-only";
import type { ProductCard } from "@/features/catalog/types";
import type { OrderStatus, TrackedOrder } from "@/features/orders/types";
import { DataError } from "@/lib/server-log";
import { createClient } from "@/lib/supabase/server";

/** Signed-in user (verified JWT) + supabase client bound to their session, or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null, supabase };
}

export async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await user.supabase
    .from("lw_profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new DataError("profile", error);
  return {
    ...user,
    fullName: data?.full_name ?? "",
    phone: data?.phone ?? "",
    role: data?.role ?? "customer",
  };
}

export async function getAddresses() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await user.supabase
    .from("lw_addresses")
    .select("id, recipient_name, phone, province, ward, street, note, is_default")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new DataError("addresses", error);
  return data;
}

export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await user.supabase
    .from("lw_orders")
    .select("id, order_code, status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new DataError("my orders", error);
  return data as {
    id: string;
    order_code: string;
    status: OrderStatus;
    total: number;
    created_at: string;
  }[];
}

export async function getMyOrder(code: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await user.supabase
    .from("lw_orders")
    .select(
      "id, order_code, status, customer_name, customer_phone, shipping_address, subtotal, shipping_fee, total, created_at, " +
        "items:lw_order_items(id, product_name, sku, image_path, unit_price, quantity), " +
        "history:lw_order_status_history(to_status, created_at, note)",
    )
    .eq("user_id", user.id)
    .eq("order_code", code)
    .maybeSingle();
  if (error) throw new DataError("my order", error);
  if (!data) return null;
  const order = data as unknown as Omit<TrackedOrder, "payment_method" | "items" | "history"> & {
    id: string;
    customer_phone: string;
    items: (TrackedOrder["items"][number] & { id: string })[];
    history: { to_status: OrderStatus; created_at: string; note: string | null }[];
  };
  order.history.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return order;
}

export async function getWishlistProducts(): Promise<ProductCard[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await user.supabase
    .from("lw_wishlists")
    .select(
      "created_at, product:lw_products(id, slug, name_vi, name_en, price, compare_at_price, stock, created_at, is_active, " +
        "brand:lw_brands(name, slug), images:lw_product_images(storage_path, alt_vi, alt_en, width, height, sort_order))",
    )
    .order("created_at", { ascending: false });
  if (error) throw new DataError("wishlist", error);
  type Row = {
    product:
      (Omit<ProductCard, "image"> & { is_active: boolean; images: ProductCard["image"][] }) | null;
  };
  return (data as unknown as Row[])
    .map((r) => r.product)
    .filter((p): p is NonNullable<Row["product"]> => Boolean(p?.is_active))
    .map(({ images, ...p }) => ({
      ...p,
      image: [...images].sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))[0] ?? null,
    }));
}
