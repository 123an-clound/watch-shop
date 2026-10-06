import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase session on `response` (writes rotated auth cookies)
 * and returns the verified user id + admin flag.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
  { checkAdmin }: { checkAdmin: boolean },
) {
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // getClaims() verifies the JWT signature; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;

  let isAdmin = false;
  if (checkAdmin && userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  return { userId, isAdmin };
}
