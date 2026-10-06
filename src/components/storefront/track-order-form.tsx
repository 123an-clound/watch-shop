"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OrderStatusBadge, OrderTimeline } from "@/components/shared/order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackOrder } from "@/features/orders/actions";
import { trackSchema, type TrackInput, type TrackValues } from "@/features/orders/schemas";
import type { TrackedOrder } from "@/features/orders/types";
import { formatDate, formatVND } from "@/lib/format";

export function TrackOrderForm({ initialCode }: { initialCode?: string }) {
  const t = useTranslations("Track");
  const tCart = useTranslations("Cart");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [order, setOrder] = useState<TrackedOrder | null | undefined>(undefined);
  const form = useForm<TrackInput, unknown, TrackValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: { code: initialCode ?? "", phone: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await trackOrder(values).catch(() => null);
      if (!result) return void toast.error(tErrors("generic"));
      if (!result.ok) return void toast.error(tErrors(result.error));
      setOrder(result.data.order);
    }),
  );

  return (
    <div className="grid gap-10">
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <FormField label={t("code")} error={errors.code} required>
          {(p) => (
            <Input
              {...p}
              placeholder={t("codePlaceholder")}
              className="font-mono uppercase"
              autoComplete="off"
              {...form.register("code")}
            />
          )}
        </FormField>
        <FormField label={t("phone")} error={errors.phone} required>
          {(p) => (
            <Input
              {...p}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...form.register("phone")}
            />
          )}
        </FormField>
        <Button type="submit" disabled={pending} className="sm:mb-0">
          {t("submit")}
        </Button>
      </form>

      <div aria-live="polite">
        {order === null && (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            {t("notFound")}
          </p>
        )}
        {order && (
          <article className="grid gap-8 rounded-lg border bg-card p-6 lg:grid-cols-[1fr_280px]">
            <div className="grid content-start gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-2xl text-primary">{order.order_code}</h2>
                <OrderStatusBadge status={order.status} />
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t("placedAt")}</dt>
                  <dd>{formatDate(order.created_at, locale)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("shipTo")}</dt>
                  <dd>
                    {order.customer_name} — {order.shipping_address.street},{" "}
                    {order.shipping_address.ward}, {order.shipping_address.province}
                  </dd>
                </div>
              </dl>
              <section>
                <h3 className="mb-3 font-sans text-sm font-semibold">{t("items")}</h3>
                <ul className="divide-y text-sm">
                  {order.items.map((i) => (
                    <li key={i.sku} className="flex justify-between gap-4 py-2">
                      <span>
                        {i.product_name} × {i.quantity}
                      </span>
                      <span className="tabular-nums">{formatVND(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 grid gap-1 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt>{tCart("shipping")}</dt>
                    <dd className="tabular-nums">
                      {order.shipping_fee === 0
                        ? tCart("shippingFree")
                        : formatVND(order.shipping_fee)}
                    </dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>{tCart("total")}</dt>
                    <dd className="tabular-nums">{formatVND(order.total)}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <section>
              <h3 className="mb-4 font-sans text-sm font-semibold">{t("timeline")}</h3>
              <OrderTimeline history={order.history} />
            </section>
          </article>
        )}
      </div>
    </div>
  );
}
