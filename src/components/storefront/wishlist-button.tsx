"use client";

import { HeartIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getWishlistState, toggleWishlist } from "@/features/account/wishlist-actions";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  slug,
  initialWishlisted,
}: {
  productId: string;
  slug: string;
  /** Known state (e.g. on the wishlist page): skips the initial lookup and refreshes on change. */
  initialWishlisted?: boolean;
}) {
  const t = useTranslations("Product");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted ?? false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialWishlisted !== undefined) return;
    let active = true;
    getWishlistState(productId)
      .then((r) => {
        if (active && r.ok) setWishlisted(r.data.wishlisted);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId, initialWishlisted]);

  const toggle = () =>
    startTransition(async () => {
      const result = await toggleWishlist(productId).catch(() => null);
      if (!result) return void toast.error(tErrors("generic"));
      if (!result.ok) {
        if (result.error === "unauthorized") {
          toast.info(t("wishlistLogin"));
          router.push({ pathname: "/login", query: { next: `/${locale}/products/${slug}` } });
          return;
        }
        return void toast.error(tErrors(result.error));
      }
      setWishlisted(result.data.wishlisted);
      if (initialWishlisted !== undefined) router.refresh();
      toast.success(result.data.wishlisted ? t("wishlistAdded") : t("wishlistRemoved"));
    });

  const label = wishlisted ? t("wishlistRemove") : t("wishlistAdd");
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label={label}
      aria-pressed={wishlisted}
      title={label}
      disabled={pending}
      onClick={toggle}
    >
      <HeartIcon className={cn(wishlisted && "fill-primary text-primary")} aria-hidden />
    </Button>
  );
}
