import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_NS } from "@/lib/cache";
import { DataError } from "@/lib/server-log";
import { createPublicClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type SiteSettings = Tables<"lw_site_settings">;

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const { data, error } = await createPublicClient()
      .from("lw_site_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) throw new DataError("settings", error);
    return data;
  },
  ["settings", CACHE_NS],
  { tags: ["settings"] },
);
