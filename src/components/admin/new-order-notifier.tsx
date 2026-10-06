"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const useNewOrders = create<{
  count: number;
  bump: () => void;
  reset: () => void;
}>((set) => ({
  count: 0,
  bump: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}));

/** Mount once (admin layout): Supabase Realtime → toast + badge for new orders. RLS limits delivery to admins. */
export function NewOrderListener() {
  const t = useTranslations("Admin.orders");
  const router = useRouter();
  const bump = useNewOrders((s) => s.bump);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("lw-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lw_orders" },
        (payload) => {
          const code = (payload.new as { order_code?: string }).order_code ?? "";
          bump();
          toast.success(t("newOrderToast", { code }), {
            action: {
              label: t("view"),
              onClick: () => router.push("/admin/orders"),
            },
          });
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bump, router, t]);

  return null;
}

export function NewOrderBadge() {
  const count = useNewOrders((s) => s.count);
  if (!count) return null;
  return (
    <span className="ml-auto rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
      {count}
    </span>
  );
}

/** Render on the orders page to clear the badge. */
export function ResetNewOrders() {
  const reset = useNewOrders((s) => s.reset);
  useEffect(() => reset(), [reset]);
  return null;
}
