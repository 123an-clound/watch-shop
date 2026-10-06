import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { safeNext } from "@/lib/action-result";
import { logServerError } from "@/lib/server-log";
import { createClient } from "@/lib/supabase/server";

/** Supabase OAuth / magic-link / recovery callback. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), `/${routing.defaultLocale}/account`);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  try {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("missing code") };
    if (!error) return NextResponse.redirect(new URL(next, origin));
    logServerError("auth.callback", error);
  } catch (e) {
    logServerError("auth.callback", e);
  }

  const segment = next.split("/")[1];
  const locale = (routing.locales as readonly string[]).includes(segment)
    ? segment
    : routing.defaultLocale;
  return NextResponse.redirect(new URL(`/${locale}/login?error=callback`, origin));
}
