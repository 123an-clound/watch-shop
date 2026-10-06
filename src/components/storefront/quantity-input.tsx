"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MAX_QTY } from "@/store/cart-store";

export function QuantityInput({
  value,
  max,
  onChange,
  size = "default",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  size?: "default" | "sm";
}) {
  const t = useTranslations("Cart");
  const limit = Math.max(1, Math.min(max, MAX_QTY));
  const btn = size === "sm" ? "icon-sm" : "icon";

  return (
    <div
      className="inline-flex items-center rounded-md border"
      role="group"
      aria-label={t("quantity")}
    >
      <Button
        type="button"
        variant="ghost"
        size={btn}
        aria-label={t("decrease")}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon aria-hidden />
      </Button>
      <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size={btn}
        aria-label={t("increase")}
        disabled={value >= limit}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon aria-hidden />
      </Button>
    </div>
  );
}
