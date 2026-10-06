import "server-only";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

/** Returns the admin's id + name, or null. Layer 2 of the admin guard (RLS is layer 3). */
export async function getAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("lw_profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "admin") return null;
  return {
    id: userId,
    name: profile.full_name || (data.claims.email as string | undefined) || "Admin",
    supabase,
  };
}

/** For admin pages/layouts: redirect non-admins away. */
export async function requireAdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect(`/${routing.defaultLocale}/login?next=/admin`);
  return admin;
}
