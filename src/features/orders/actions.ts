"use server";

import { after } from "next/server";
import { updateTag } from "next/cache";
import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getClientIp, sha256 } from "@/lib/request";
import { logServerError } from "@/lib/server-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { getSettings } from "../settings/queries";
import { sendOrderConfirmation } from "./email";
import { placeOrderSchema, trackSchema, type TrackInput } from "./schemas";
import type { TrackedOrder } from "./types";

export type CartSnapshot = {
  productId: string;
  price: number;
  stock: number;
  nameVi: string;
  nameEn: string;
  slug: string;
};

/** Latest price/stock for cart lines. Missing ids = inactive or deleted products. */
export async function validateCart(
  productIds: string[],
): Promise<ActionResult<{ products: CartSnapshot[] }>> {
  const parsed = z.array(z.uuid()).max(50).safeParse(productIds);
  if (!parsed.success) return fail("invalidInput");
  if (!parsed.data.length) return ok({ products: [] });
  try {
    const { data, error } = await createPublicClient()
      .from("lw_products")
      .select("id, slug, name_vi, name_en, price, stock")
      .in("id", parsed.data)
      .eq("is_active", true);
    if (error) throw error;
    return ok({
      products: data.map((p) => ({
        productId: p.id,
        slug: p.slug,
        nameVi: p.name_vi,
        nameEn: p.name_en,
        price: p.price,
        stock: p.stock,
      })),
    });
  } catch (e) {
    logServerError("cart.validate", e);
    return fail("generic");
  }
}

const RPC_ERRORS = {
  RATE_LIMITED: "rateLimited",
  OUT_OF_STOCK: "outOfStock",
  PRODUCT_UNAVAILABLE: "productUnavailable",
  INVALID_NAME: "invalidInput",
  INVALID_PHONE: "invalidInput",
  INVALID_EMAIL: "invalidInput",
  INVALID_ADDRESS: "invalidInput",
  INVALID_ITEMS: "invalidInput",
} as const;

export async function placeOrder(input: unknown): Promise<ActionResult<{ orderCode: string }>> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const { form, items, locale } = parsed.data;

  // Honeypot: pretend success-like failure without hitting the DB.
  if (form.company) return fail("invalidInput");

  try {
    const ip = await getClientIp();
    if (!(await verifyTurnstile(form.turnstileToken, ip))) return fail("captcha");

    // Identify the signed-in user server-side (never trust a client-provided id).
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub ?? null;

    const { data: orderCode, error } = await createAdminClient().rpc("lw_place_order", {
      payload: {
        user_id: userId,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        locale,
        ip,
        shipping_address: {
          province: form.province,
          ward: form.ward,
          street: form.street,
          note: form.note,
        },
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      },
    });
    if (error) {
      const mapped = RPC_ERRORS[error.message as keyof typeof RPC_ERRORS];
      if (!mapped) logServerError("orders.place", error);
      return fail(mapped ?? "generic");
    }

    updateTag("products"); // stock changed

    if (form.email) {
      const email = form.email;
      after(async () => {
        const [settings, { data: lines }] = await Promise.all([
          getSettings(),
          createAdminClient()
            .from("lw_orders")
            .select("total, items:lw_order_items(product_name, quantity, unit_price)")
            .eq("order_code", orderCode)
            .single(),
        ]);
        if (!lines) return;
        await sendOrderConfirmation({
          to: email,
          locale,
          storeName: settings.store_name,
          orderCode,
          customerName: form.name,
          items: lines.items,
          total: lines.total,
        });
      });
    }

    return ok({ orderCode });
  } catch (e) {
    logServerError("orders.place", e);
    return fail("generic");
  }
}

export async function trackOrder(
  input: TrackInput,
): Promise<ActionResult<{ order: TrackedOrder | null }>> {
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const ip = (await getClientIp()) ?? "unknown";
    const admin = createAdminClient();
    const { data: allowed, error: limitError } = await admin.rpc("lw_hit_rate_limit", {
      p_bucket: `track:${sha256(ip)}`,
      p_max: 10,
      p_window_seconds: 600,
    });
    if (limitError) throw limitError;
    if (!allowed) return fail("rateLimited");

    const { data, error } = await admin.rpc("lw_get_order_by_code", {
      p_code: parsed.data.code,
      p_phone: parsed.data.phone,
    });
    if (error) throw error;
    return ok({ order: (data as TrackedOrder | null) ?? null });
  } catch (e) {
    logServerError("orders.track", e);
    return fail("generic");
  }
}
