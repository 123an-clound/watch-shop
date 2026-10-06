"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cartCount, useCart, useHydrated } from "@/store/cart-store";

export function CartButton() {
  const t = useTranslations("Nav");
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.items));
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const shown = hydrated ? count : 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={t("cartCount", { count: shown })}
      onClick={() => setDrawerOpen(true)}
    >
      <ShoppingBagIcon aria-hidden />
      {shown > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
        >
          {shown > 9 ? "9+" : shown}
        </span>
      )}
    </Button>
  );
}
