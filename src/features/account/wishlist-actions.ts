"use server";

import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { logServerError } from "@/lib/server-log";
import { createClient } from "@/lib/supabase/server";

const productId = z.uuid();

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims.sub ?? null };
}

export async function getWishlistState(
  id: string,
): Promise<ActionResult<{ signedIn: boolean; wishlisted: boolean }>> {
  if (!productId.safeParse(id).success) return fail("invalidInput");
  try {
    const { supabase, userId } = await currentUser();
    if (!userId) return ok({ signedIn: false, wishlisted: false });
    const { count, error } = await supabase
      .from("lw_wishlists")
      .select("product_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("product_id", id);
    if (error) throw error;
    return ok({ signedIn: true, wishlisted: (count ?? 0) > 0 });
  } catch (e) {
    logServerError("wishlist.state", e);
    return fail("generic");
  }
}

export async function toggleWishlist(id: string): Promise<ActionResult<{ wishlisted: boolean }>> {
  if (!productId.safeParse(id).success) return fail("invalidInput");
  try {
    const { supabase, userId } = await currentUser();
    if (!userId) return fail("unauthorized");
    const { data: existing } = await supabase
      .from("lw_wishlists")
      .select("product_id")
      .eq("user_id", userId)
      .eq("product_id", id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("lw_wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", id);
      if (error) throw error;
      return ok({ wishlisted: false });
    }
    const { error } = await supabase
      .from("lw_wishlists")
      .insert({ user_id: userId, product_id: id });
    if (error) throw error;
    return ok({ wishlisted: true });
  } catch (e) {
    logServerError("wishlist.toggle", e);
    return fail("generic");
  }
}
