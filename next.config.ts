import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./src/env";

const supabaseUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseOrigin = supabaseUrl.origin;
const supabaseWs = supabaseOrigin.replace(/^http/, "ws");
const isDev = process.env.NODE_ENV !== "production";

// ponytail: static CSP with 'unsafe-inline' scripts keeps pages statically cacheable;
// switch to per-request nonces in proxy.ts if strict script-src is required (forces dynamic rendering).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://images.unsplash.com`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Only for a local Supabase stack (127.0.0.1); hosted Supabase never needs this.
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname),
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default createNextIntlPlugin()(nextConfig);
