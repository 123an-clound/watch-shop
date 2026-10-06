import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";
import { serverEnv } from "@/env.server";
import type { Database } from "@/types/database.types";

/**
 * Service-role client: BYPASSES RLS. Server-only.
 * Use only for trusted operations (place_order, guest order lookup, storage cleanup)
 * after the caller has been validated.
 */
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
