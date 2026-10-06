"use client";

import { useTranslations } from "next-intl";
import { formatVND } from "@/lib/format";

export function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const t = useTranslations("Cart");
  if (threshold <= 0) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="space-y-2">
      <p className="text-sm">
        {remaining > 0
          ? t("freeShippingProgress", { amount: formatVND(remaining) })
          : t("freeShippingReached")}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
