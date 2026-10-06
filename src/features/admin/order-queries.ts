import "server-only";
import type { OrderStatus, ShippingAddress } from "@/features/orders/types";
import { DataError } from "@/lib/server-log";
import { requireAdminPage } from "./auth";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export async function adminListOrders(filters: { q?: string; status?: OrderStatus; page: number }) {
  const { supabase } = await requireAdminPage();
  let query = supabase
    .from("lw_orders")
    .select("id, order_code, customer_name, customer_phone, total, status, created_at, user_id", {
      count: "exact",
    });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const q = filters.q.replace(/[%_,()]/g, " ").trim();
    if (q) {
      query = query.or(
        `order_code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`,
      );
    }
  }
  const from = (filters.page - 1) * ADMIN_ORDERS_PAGE_SIZE;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_ORDERS_PAGE_SIZE - 1);
  if (error) throw new DataError("admin orders", error);
  return {
    items: data as (Omit<(typeof data)[number], "status"> & { status: OrderStatus })[],
    total: count ?? 0,
  };
}

export type AdminOrder = {
  id: string;
  order_code: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  status: OrderStatus;
  locale: string;
  created_at: string;
  items: {
    id: string;
    product_id: string | null;
    product_name: string;
    sku: string;
    image_path: string | null;
    unit_price: number;
    quantity: number;
  }[];
  history: {
    id: number;
    from_status: OrderStatus | null;
    to_status: OrderStatus;
    note: string | null;
    created_at: string;
  }[];
};

export async function adminGetOrder(id: string) {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("lw_orders")
    .select(
      "id, order_code, user_id, customer_name, customer_phone, customer_email, shipping_address, subtotal, " +
        "shipping_fee, total, payment_method, status, locale, created_at, " +
        "items:lw_order_items(id, product_id, product_name, sku, image_path, unit_price, quantity), " +
        "history:lw_order_status_history(id, from_status, to_status, note, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new DataError("admin order", error);
  if (!data) return null;
  const order = data as unknown as AdminOrder;
  order.history.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return order;
}

export type DashboardData = {
  revenue: { today: number; d7: number; d30: number; all: number };
  orders: { today: number; d7: number; d30: number };
  byStatus: Partial<Record<OrderStatus, number>>;
  daily: { day: string; revenue: number; orders: number }[];
  lowStock: { id: string; name: string; sku: string; stock: number }[];
  latest: {
    id: string;
    code: string;
    name: string;
    total: number;
    status: OrderStatus;
    created_at: string;
  }[];
};

export async function adminDashboard() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.rpc("lw_admin_dashboard");
  if (error) throw new DataError("admin dashboard", error);
  return data as unknown as DashboardData;
}

export const ADMIN_CUSTOMERS_PAGE_SIZE = 20;

export async function adminCustomers(search: string | undefined, page: number) {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.rpc("lw_admin_customers", {
    p_search: search ?? "",
    p_limit: ADMIN_CUSTOMERS_PAGE_SIZE,
    p_offset: (page - 1) * ADMIN_CUSTOMERS_PAGE_SIZE,
  });
  if (error) throw new DataError("admin customers", error);
  return { items: data, total: Number(data[0]?.total_count ?? 0) };
}
