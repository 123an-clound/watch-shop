import "server-only";
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
