"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { OrderStatus } from "@/features/orders/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const tone: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  confirmed: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  shipping: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/15 text-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("Status");
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone[status])}
    >
      {t(status)}
    </span>
  );
}

export function OrderTimeline({
  history,
}: {
  history: { to_status: OrderStatus; created_at: string; note?: string | null }[];
}) {
  const t = useTranslations("Status");
  const locale = useLocale();
  return (
    <ol className="grid gap-4">
      {history.map((h, i) => (
        <li key={i} className="flex gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
              i === history.length - 1
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border",
            )}
          >
            <CheckIcon className="size-3" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-medium">{t(h.to_status)}</p>
            <p className="text-muted-foreground">{formatDate(h.created_at, locale)}</p>
            {h.note && <p className="mt-1 text-muted-foreground italic">{h.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
