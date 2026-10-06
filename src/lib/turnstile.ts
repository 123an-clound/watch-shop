import "server-only";
import { serverEnv } from "@/env.server";
import { logServerError } from "./server-log";

/** Cloudflare Turnstile check — a no-op (passes) when TURNSTILE_SECRET_KEY is not configured. */
export async function verifyTurnstile(token: string | undefined, ip: string | null) {
  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    logServerError("turnstile", e);
    return false;
  }
}
