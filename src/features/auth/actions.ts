"use server";

import type { AuthError } from "@supabase/supabase-js";
import { routing } from "@/i18n/routing";
import { type ActionResult, type ErrorCode, fail, ok } from "@/lib/action-result";
import { SITE_URL } from "@/lib/seo";
import { logServerError } from "@/lib/server-log";
import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type EmailInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "./schemas";

function mapAuthError(scope: string, error: AuthError): ErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "weak_password":
      return "weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      logServerError(scope, error);
      return "generic";
  }
}

const locale = (value: string) =>
  (routing.locales as readonly string[]).includes(value) ? value : routing.defaultLocale;

const callbackUrl = (next: string) => `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signInWithPassword(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return fail(mapAuthError("auth.signIn", error));
    return ok(undefined);
  } catch (e) {
    logServerError("auth.signIn", e);
    return fail("generic");
  }
}

export async function signUp(input: RegisterInput, lang: string): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: callbackUrl(`/${locale(lang)}/account`),
      },
    });
    if (error) return fail(mapAuthError("auth.signUp", error));
    return ok(undefined);
  } catch (e) {
    logServerError("auth.signUp", e);
    return fail("generic");
  }
}

export async function sendMagicLink(input: EmailInput, lang: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: callbackUrl(`/${locale(lang)}/account`),
        shouldCreateUser: true,
      },
    });
    if (error) return fail(mapAuthError("auth.magicLink", error));
    return ok(undefined);
  } catch (e) {
    logServerError("auth.magicLink", e);
    return fail("generic");
  }
}

export async function requestPasswordReset(input: EmailInput, lang: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: callbackUrl(`/${locale(lang)}/reset-password`),
    });
    // Do not reveal whether the email exists; only surface rate limits.
    if (error && mapAuthError("auth.reset", error) === "rateLimited") return fail("rateLimited");
    return ok(undefined);
  } catch (e) {
    logServerError("auth.reset", e);
    return fail("generic");
  }
}

export async function updatePassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail("invalidInput");
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) return fail("unauthorized");
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return fail(mapAuthError("auth.updatePassword", error));
    return ok(undefined);
  } catch (e) {
    logServerError("auth.updatePassword", e);
    return fail("generic");
  }
}

export async function signOut(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return ok(undefined);
  } catch (e) {
    logServerError("auth.signOut", e);
    return fail("generic");
  }
}
