import { env } from "@/env";

export const PRODUCT_BUCKET = "lw-products";
export const SITE_BUCKET = "lw-site";

/** Storage path → public URL. Absolute URLs (e.g. seed placeholders) pass through. */
export function publicImageUrl(path: string, bucket: string = PRODUCT_BUCKET) {
  if (/^https?:\/\//.test(path)) return path;
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
