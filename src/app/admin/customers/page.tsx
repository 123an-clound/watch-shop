import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
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
import { ADMIN_CUSTOMERS_PAGE_SIZE, adminCustomers } from "@/features/admin/order-queries";
import { formatDate, formatVND } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.customers");
  return { title: t("title") };
}

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const raw = await searchParams;
  const filters = filtersSchema.parse({ q: raw.q || undefined, page: raw.page });
  const [t, tc, { items, total }] = await Promise.all([
    getTranslations("Admin.customers"),
    getTranslations("Admin.common"),
    adminCustomers(filters.q, filters.page),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <form className="mb-4 flex gap-2" role="search">
        <label htmlFor="customer-q" className="sr-only">
          {t("searchPlaceholder")}
        </label>
        <Input
          id="customer-q"
          name="q"
          defaultValue={filters.q}
          placeholder={t("searchPlaceholder")}
          className="w-64"
        />
        <Button type="submit" variant="secondary">
          {tc("search")}
        </Button>
      </form>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("phone")}</TableHead>
              <TableHead className="text-right">{t("orders")}</TableHead>
              <TableHead className="text-right">{t("spent")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("joined")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {filters.q ? tc("noResults") : t("empty")}
                </TableCell>
              </TableRow>
            )}
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="font-medium">{c.full_name || "—"}</span>
                  {c.role === "admin" && (
                    <Badge variant="outline" className="ml-2">
                      {t("admin")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{c.email}</TableCell>
                <TableCell className="hidden text-sm md:table-cell">{c.phone || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{c.order_count}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVND(Number(c.total_spent))}
                </TableCell>
                <TableCell className="hidden text-sm lg:table-cell">
                  {formatDate(c.created_at, "vi")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        basePath="/admin/customers"
        params={{ q: filters.q }}
        page={filters.page}
        total={total}
        pageSize={ADMIN_CUSTOMERS_PAGE_SIZE}
      />
    </>
  );
}
