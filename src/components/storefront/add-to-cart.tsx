"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { type CartItem, useCart } from "@/store/cart-store";
import { QuantityInput } from "./quantity-input";

export function AddToCart({ item }: { item: Omit<CartItem, "quantity"> }) {
  const t = useTranslations("Product");
  const add = useCart((s) => s.add);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const soldOut = item.stock <= 0;

  if (soldOut) {
    return (
      <Button size="lg" disabled className="w-full">
        {t("outOfStock")}
      </Button>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t("quantity")}</span>
        <QuantityInput value={quantity} max={item.stock} onChange={setQuantity} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" onClick={() => add(item, quantity)}>
          <ShoppingBagIcon aria-hidden />
          {t("addToCart")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            add(item, quantity);
            setDrawerOpen(false);
            router.push("/checkout");
          }}
        >
          {t("buyNow")}
        </Button>
      </div>
    </div>
  );
}
