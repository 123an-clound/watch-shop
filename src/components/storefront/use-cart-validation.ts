"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { validateCart } from "@/features/orders/actions";
import { useCart, useHydrated } from "@/store/cart-store";

/**
 * Re-check prices/stock against the server once the persisted cart is loaded.
 * Removes unavailable items, clamps quantities, updates prices.
 */
export function useCartValidation() {
  const t = useTranslations("Cart");
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const sync = useCart((s) => s.sync);
  const [checked, setChecked] = useState(false);
  const ids = items.map((i) => i.productId).join(",");

  useEffect(() => {
    if (!hydrated || checked) return;
    const current = useCart.getState().items;
    if (!current.length) return;
    let active = true;
    validateCart(current.map((i) => i.productId))
      .then((result) => {
        if (!active || !result.ok) return;
        const found = new Map(result.data.products.map((p) => [p.productId, p]));
        const removed = current.filter((i) => !found.has(i.productId)).map((i) => i.productId);
        const changed =
          removed.length > 0 ||
          current.some((i) => {
            const p = found.get(i.productId);
            return p && (p.price !== i.price || p.stock < i.quantity);
          });
        sync(result.data.products, removed);
        if (changed) toast.warning(t("updated"));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, [hydrated, checked, ids, sync, t]);

  return { hydrated, checked: checked || (hydrated && items.length === 0) };
}
