/**
 * Public env for client-reachable modules, without pulling zod into the browser bundle.
 * Values are validated at build time (next.config.ts imports src/env.ts) and inlined by Next.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
};
