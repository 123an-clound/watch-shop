import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/storefront/product-card";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { Button } from "@/components/ui/button";
import { getWishlistProducts } from "@/features/account/queries";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/wishlist">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("wishlist") };
}

export default async function WishlistPage({ params }: PageProps<"/[locale]/account/wishlist">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCart, products] = await Promise.all([
    getTranslations("Account"),
    getTranslations("Cart"),
    getWishlistProducts(),
  ]);

  return (
    <section>
      <h1 className="text-2xl">{t("wishlist")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("wishlistDescription")}</p>
      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">{t("noWishlist")}</p>
          <Button className="mt-6" asChild>
            <Link href="/products">{tCart("emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="relative">
              <ProductCard product={p} headingLevel="h2" />
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton productId={p.id} slug={p.slug} initialWishlisted />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
