import { env } from "@/env";

/** Cache-key namespace: data cached for one Supabase project is never reused for another. */
export const CACHE_NS = env.NEXT_PUBLIC_SUPABASE_URL;
