"use client";

import Script from "next/script";
import { env } from "@/env";

/** Cloudflare Turnstile widget (implicit render). Renders nothing when not configured. */
export function Turnstile() {
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
    </>
  );
}

/** Token the widget writes into the form. */
export function readTurnstileToken(form: HTMLFormElement | null) {
  const input = form?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
  return input?.value || undefined;
}
