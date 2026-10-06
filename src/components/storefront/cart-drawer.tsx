"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { formatVND } from "@/lib/format";
import { cartSubtotal, useCart, useHydrated } from "@/store/cart-store";
import { CartLine } from "./cart-line";
import { FreeShippingBar } from "./free-shipping-bar";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");
  const hydrated = useHydrated();
  const open = useCart((s) => s.drawerOpen);
  const setOpen = useCart((s) => s.setDrawerOpen);
  const items = useCart((s) => s.items);
  const subtotal = cartSubtotal(items);
  const close = () => setOpen(false);

  return (
    <Sheet open={hydrated && open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md"
        closeLabel={tc("close")}
      >
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">{t("title")}</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
            <Button asChild onClick={close}>
              <Link href="/products">{t("emptyCta")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="px-4">
              <FreeShippingBar subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {items.map((item) => (
                <CartLine key={item.productId} item={item} onNavigate={close} />
              ))}
            </ul>
            <SheetFooter className="border-t">
              <div className="flex items-center justify-between text-base">
                <span>{t("subtotal")}</span>
                <span className="font-semibold tabular-nums">{formatVND(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("shipping")}: {t("shippingAtCheckout")}
              </p>
              <Button asChild size="lg" onClick={close}>
                <Link href="/checkout">{t("checkout")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" onClick={close}>
                <Link href="/cart">{t("viewCart")}</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
