"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/features/admin/auth";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { logServerError } from "@/lib/server-log";
import { createClient } from "@/lib/supabase/server";

const submitSchema = z.object({
  productId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
});

export type ReviewEligibility = { signedIn: boolean; eligible: boolean; pending: boolean };

/** Can the current user review this product (delivered order containing it)? */
export async function getReviewEligibility(
  productId: string,
): Promise<ActionResult<ReviewEligibility>> {
  if (!z.uuid().safeParse(productId).success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return ok({ signedIn: false, eligible: false, pending: false });

    // RLS limits both queries to the caller's own rows.
    const [{ count }, { data: own }] = await Promise.all([
      supabase
        .from("lw_order_items")
        .select("id, order:lw_orders!inner(status, user_id)", { count: "exact", head: true })
        .eq("product_id", productId)
        .eq("order.status", "delivered")
        .eq("order.user_id", userId),
      supabase
        .from("lw_reviews")
        .select("status")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return ok({ signedIn: true, eligible: (count ?? 0) > 0, pending: own?.status === "pending" });
  } catch (e) {
    logServerError("reviews.eligibility", e);
    return fail("generic");
  }
}

export async function submitReview(input: z.input<typeof submitSchema>): Promise<ActionResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("lw_submit_review", {
      p_product_id: parsed.data.productId,
      p_rating: parsed.data.rating,
      p_body: parsed.data.body,
    });
    if (error) {
      if (error.message === "UNAUTHORIZED") return fail("unauthorized");
      if (error.message === "NOT_ELIGIBLE") return fail("notEligible");
      if (error.message === "INVALID_INPUT") return fail("invalidInput");
      throw error;
    }
    return ok(undefined);
  } catch (e) {
    logServerError("reviews.submit", e);
    return fail("generic");
  }
}

const moderateSchema = z.object({ id: z.uuid(), status: z.enum(["approved", "rejected"]) });

export async function moderateReview(input: z.input<typeof moderateSchema>): Promise<ActionResult> {
  const parsed = moderateSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { error } = await admin.supabase
      .from("lw_reviews")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id);
    if (error) throw error;
    updateTag("reviews");
    return ok(undefined);
  } catch (e) {
    logServerError("reviews.moderate", e);
    return fail("generic");
  }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("invalidInput");
  const admin = await getAdmin();
  if (!admin) return fail("forbidden");
  try {
    const { error } = await admin.supabase.from("lw_reviews").delete().eq("id", id);
    if (error) throw error;
    updateTag("reviews");
    return ok(undefined);
  } catch (e) {
    logServerError("reviews.delete", e);
    return fail("generic");
  }
}
