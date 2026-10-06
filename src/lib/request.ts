import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** Best-effort client IP (Vercel sets x-forwarded-for; first entry is the client). */
export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
