"use client";

import Script from "next/script";
import { publicEnv } from "@/lib/public-env";

/** Cloudflare Turnstile widget (implicit render). Renders nothing when not configured. */
export function Turnstile() {
  const siteKey = publicEnv.turnstileSiteKey;
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
