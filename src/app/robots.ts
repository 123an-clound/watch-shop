import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

const privatePaths = [
  "/account",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/track-order",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth/",
        "/api/",
        ...routing.locales.flatMap((l) => privatePaths.map((p) => `/${l}${p}`)),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
