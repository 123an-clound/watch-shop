import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { RevenueChartLazy } from "@/components/admin/revenue-chart-lazy";
import { OrderStatusBadge } from "@/components/shared/order-status";
import { adminDashboard } from "@/features/admin/order-queries";
import { ORDER_STATUSES } from "@/features/orders/types";
import { formatDate, formatVND } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.dashboard");
  return { title: t("title") };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [t, tStatus, data] = await Promise.all([
    getTranslations("Admin.dashboard"),
    getTranslations("Status"),
    adminDashboard(),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("revenueToday")} value={formatVND(data.revenue.today)} />
        <Stat label={t("revenue7")} value={formatVND(data.revenue.d7)} />
        <Stat label={t("revenue30")} value={formatVND(data.revenue.d30)} />
        <Stat
          label={t("ordersToday")}
          value={String(data.orders.today)}
          hint={t("orders7", { count: data.orders.d7 })}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold">{t("chartTitle")}</h2>
          <RevenueChartLazy data={data.daily} />
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold">{t("byStatus")}</h2>
          <ul className="grid gap-3">
            {ORDER_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <Link href={`/admin/orders?status=${s}`} className="hover:underline">
                  {tStatus(s)}
                </Link>
                <span className="font-semibold tabular-nums">{data.byStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-base font-semibold">{t("latestOrders")}</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              {t("viewAll")}
            </Link>
          </div>
          {data.latest.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <ul className="divide-y">
              {data.latest.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {o.code}
                  </Link>
                  <span className="text-muted-foreground">{o.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(o.created_at, "vi")}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <OrderStatusBadge status={o.status} />
                    <span className="tabular-nums">{formatVND(o.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold">{t("lowStock")}</h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("lowStockEmpty")}</p>
          ) : (
            <ul className="divide-y">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-primary">
                    {p.name}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                  <span
                    className={`ml-auto font-semibold tabular-nums ${p.stock === 0 ? "text-destructive" : ""}`}
                  >
                    {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
