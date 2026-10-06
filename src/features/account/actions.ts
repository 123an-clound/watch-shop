"use server";

import { z } from "zod";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { logServerError } from "@/lib/server-log";
import { getCurrentUser } from "./queries";
import { addressSchema, profileSchema, type AddressInput, type ProfileInput } from "./schemas";

const MAX_ADDRESSES = 10;

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const user = await getCurrentUser();
    if (!user) return fail("unauthorized");
    // Column-level grants only allow full_name/phone; RLS limits it to the user's own row.
    const { error } = await user.supabase
      .from("lw_profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
      .eq("id", user.id);
    if (error) throw error;
    return ok(undefined);
  } catch (e) {
    logServerError("account.updateProfile", e);
    return fail("generic");
  }
}

export async function saveAddress(input: AddressInput): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const user = await getCurrentUser();
    if (!user) return fail("unauthorized");
    const { id, recipientName, isDefault, note, ...rest } = parsed.data;

    if (!id) {
      const { count } = await user.supabase
        .from("lw_addresses")
        .select("id", { count: "exact", head: true });
      if ((count ?? 0) >= MAX_ADDRESSES) return fail("invalidInput");
    }
    // Only one default per user (partial unique index) — clear the old one first.
    if (isDefault) {
      const { error } = await user.supabase
        .from("lw_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
      if (error) throw error;
    }
    const row = {
      ...rest,
      recipient_name: recipientName,
      note: note || null,
      is_default: isDefault,
    };
    const { error } = id
      ? await user.supabase.from("lw_addresses").update(row).eq("id", id)
      : await user.supabase.from("lw_addresses").insert({ ...row, user_id: user.id });
    if (error) throw error;
    return ok(undefined);
  } catch (e) {
    logServerError("account.saveAddress", e);
    return fail("generic");
  }
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("invalidInput");
  try {
    const user = await getCurrentUser();
    if (!user) return fail("unauthorized");
    const { error } = await user.supabase.from("lw_addresses").delete().eq("id", id);
    if (error) throw error;
    return ok(undefined);
  } catch (e) {
    logServerError("account.deleteAddress", e);
    return fail("generic");
  }
}
