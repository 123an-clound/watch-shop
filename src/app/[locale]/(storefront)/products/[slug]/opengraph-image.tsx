import { getProductBySlug } from "@/features/catalog/queries";
import { getSettings } from "@/features/settings/queries";
import { formatVND } from "@/lib/format";
import { pick } from "@/lib/i18n-utils";
import { OG_SIZE, renderOg } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);

  return renderOg({
    eyebrow: product?.brand?.name ?? settings.store_name,
    title: product ? pick(product, "name", locale) : settings.store_name,
    subtitle: product ? formatVND(product.price) : undefined,
    footer: settings.store_name,
  });
}
