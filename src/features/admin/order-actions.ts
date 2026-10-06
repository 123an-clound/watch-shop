"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { ORDER_STATUSES } from "@/features/orders/types";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { logServerError } from "@/lib/server-log";
import { getAdmin } from "./auth";

const statusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500),
});

/** Validated transitions + history are enforced in lw_update_order_status / lw_cancel_order. */
export async function updateOrderStatus(
  input: z.input<typeof statusSchema>,
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success || parsed.data.status === "pending") return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { orderId, status, note } = parsed.data;
    const { error } =
      status === "cancelled"
        ? await admin.supabase.rpc("lw_cancel_order", {
            p_order_id: orderId,
            p_note: note || undefined,
          })
        : await admin.supabase.rpc("lw_update_order_status", {
            p_order_id: orderId,
            p_to_status: status,
            p_note: note || undefined,
          });
    if (error) {
      if (error.message === "INVALID_TRANSITION") return fail("invalidInput");
      if (error.message === "NOT_FOUND") return fail("notFound");
      if (error.message === "FORBIDDEN") return fail("forbidden");
      throw error;
    }
    // Cancelling restores stock; keep storefront stock fresh.
    if (status === "cancelled") updateTag("products");
    return ok(undefined);
  } catch (e) {
    logServerError("admin.updateOrderStatus", e);
    return fail("generic");
  }
}
