import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ResetNewOrders } from "@/components/admin/new-order-notifier";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/shared/order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ORDERS_PAGE_SIZE, adminListOrders } from "@/features/admin/order-queries";
import { ORDER_STATUSES } from "@/features/orders/types";
import { formatDate, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("title") };
}

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const raw = await searchParams;
  const filters = filtersSchema.parse({
    q: raw.q || undefined,
    status: raw.status || undefined,
    page: raw.page,
  });
  const [t, tStatus, { items, total }] = await Promise.all([
    getTranslations("Admin.orders"),
    getTranslations("Status"),
    adminListOrders(filters),
  ]);
  const statusHref = (status?: string) => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set("q", filters.q);
    if (status) qs.set("status", status);
    const s = qs.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <>
      <ResetNewOrders />
      <PageHeader title={t("title")} description={t("description")} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label={t("status")} className="flex flex-wrap gap-1">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <Button
              key={s ?? "all"}
              variant={filters.status === s ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={statusHref(s)} aria-current={filters.status === s ? "page" : undefined}>
                {s ? tStatus(s) : t("all")}
              </Link>
            </Button>
          ))}
        </nav>
        <form className="ml-auto flex gap-2" role="search">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <label htmlFor="order-q" className="sr-only">
            {t("searchPlaceholder")}
          </label>
          <Input
            id="order-q"
            name="q"
            defaultValue={filters.q}
            placeholder={t("searchPlaceholder")}
            className="w-60"
          />
          <Button type="submit" variant="secondary">
            {t("apply")}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("date")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {items.map((o) => (
              <TableRow key={o.id} className={cn(o.status === "pending" && "bg-primary/5")}>
                <TableCell>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {o.order_code}
                  </Link>
                </TableCell>
                <TableCell>
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                </TableCell>
                <TableCell className="hidden text-sm md:table-cell">
                  {formatDate(o.created_at, "vi")}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatVND(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        basePath="/admin/orders"
        params={{ q: filters.q, status: filters.status }}
        page={filters.page}
        total={total}
        pageSize={ADMIN_ORDERS_PAGE_SIZE}
      />
    </>
  );
}
