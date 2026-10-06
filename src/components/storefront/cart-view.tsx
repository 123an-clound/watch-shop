"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { formatVND } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";
import { cartSubtotal, useCart } from "@/store/cart-store";
import { CartLine } from "./cart-line";
import { FreeShippingBar } from "./free-shipping-bar";
import { useCartValidation } from "./use-cart-validation";

export function CartView({
  shippingFee,
  freeShippingThreshold,
}: {
  shippingFee: number;
  freeShippingThreshold: number;
}) {
  const t = useTranslations("Cart");
  const items = useCart((s) => s.items);
  const { hydrated, checked } = useCartValidation();
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal, shippingFee, freeShippingThreshold);

  if (!hydrated) {
    return <Skeleton className="h-64 w-full" aria-label={t("checking")} />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-20 text-center">
        <p className="text-lg">{t("empty")}</p>
        <Button className="mt-6" asChild>
          <Link href="/products">{t("emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y border-y">
        {items.map((item) => (
          <CartLine key={item.productId} item={item} />
        ))}
      </ul>
      <aside
        className="h-fit rounded-lg border bg-card p-6 lg:sticky lg:top-24"
        aria-label={t("summary")}
      >
        <h2 className="mb-4 text-xl">{t("summary")}</h2>
        <FreeShippingBar subtotal={subtotal} threshold={freeShippingThreshold} />
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt>{t("subtotal")}</dt>
            <dd className="tabular-nums">{formatVND(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("shipping")}</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? t("shippingFree") : formatVND(shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums">{formatVND(subtotal + shipping)}</dd>
          </div>
        </dl>
        <Button size="lg" className="mt-6 w-full" asChild disabled={!checked}>
          <Link href="/checkout">{t("checkout")}</Link>
        </Button>
        <Button size="lg" variant="ghost" className="mt-2 w-full" asChild>
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </aside>
    </div>
  );
}
