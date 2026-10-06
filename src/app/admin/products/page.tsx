import { PencilIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
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
import { deleteProduct } from "@/features/admin/catalog-actions";
import { ADMIN_PAGE_SIZE, adminListProducts } from "@/features/admin/catalog-queries";
import { getBrands, getCategories } from "@/features/catalog/queries";
import { formatVND } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.products");
  return { title: t("title") };
}

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.uuid().optional().catch(undefined),
  brand: z.uuid().optional().catch(undefined),
  status: z.enum(["active", "inactive", "low"]).optional().catch(undefined),
  sort: z.enum(["newest", "name", "price_asc", "price_desc", "stock"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

const selectClass =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-input/30";

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const raw = await searchParams;
  const filters = filtersSchema.parse({
    q: raw.q || undefined,
    category: raw.category || undefined,
    brand: raw.brand || undefined,
    status: raw.status || undefined,
    sort: raw.sort,
    page: raw.page,
  });

  const [t, tc, { items, total }, categories, brands] = await Promise.all([
    getTranslations("Admin.products"),
    getTranslations("Admin.common"),
    adminListProducts(filters),
    getCategories(),
    getBrands(),
  ]);
  const hasFilters = Boolean(filters.q || filters.category || filters.brand || filters.status);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusIcon aria-hidden />
            {t("new")}
          </Link>
        </Button>
      </PageHeader>

      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <div className="grid gap-1">
          <label htmlFor="q" className="text-xs text-muted-foreground">
            {tc("search")}
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder={t("searchPlaceholder")}
            className="w-56"
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="category" className="text-xs text-muted-foreground">
            {t("category")}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={filters.category ?? ""}
            className={selectClass}
          >
            <option value="">{tc("all")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_vi}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="brand" className="text-xs text-muted-foreground">
            {t("brand")}
          </label>
          <select
            id="brand"
            name="brand"
            defaultValue={filters.brand ?? ""}
            className={selectClass}
          >
            <option value="">{tc("all")}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="status" className="text-xs text-muted-foreground">
            {t("status")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className={selectClass}
          >
            <option value="">{tc("all")}</option>
            <option value="active">{t("statusActive")}</option>
            <option value="inactive">{t("statusInactive")}</option>
            <option value="low">{t("statusLow")}</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="sort" className="text-xs text-muted-foreground">
            {t("sort")}
          </label>
          <select id="sort" name="sort" defaultValue={filters.sort} className={selectClass}>
            <option value="newest">{t("sortNewest")}</option>
            <option value="name">{t("sortName")}</option>
            <option value="price_asc">{t("sortPriceAsc")}</option>
            <option value="price_desc">{t("sortPriceDesc")}</option>
            <option value="stock">{t("sortStock")}</option>
          </select>
        </div>
        <Button type="submit" variant="secondary">
          {tc("filter")}
        </Button>
        {hasFilters && (
          <Button variant="ghost" asChild>
            <Link href="/admin/products">{tc("reset")}</Link>
          </Button>
        )}
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t("image")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("brand")}</TableHead>
              <TableHead className="text-right">{t("price")}</TableHead>
              <TableHead className="text-right">{t("stock")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="w-24 text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {hasFilters ? tc("noResults") : tc("empty")}
                </TableCell>
              </TableRow>
            )}
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="relative aspect-[4/5] w-10 overflow-hidden rounded bg-muted">
                    {p.imagePath && (
                      <Image
                        src={publicImageUrl(p.imagePath)}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-primary">
                    {p.name_vi}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{p.brand?.name ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatVND(p.price)}</TableCell>
                <TableCell
                  className={`text-right tabular-nums ${p.stock <= 3 ? "text-destructive" : ""}`}
                >
                  {p.stock}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? t("statusActive") : t("statusInactive")}
                    </Badge>
                    {p.is_featured && <Badge variant="outline">{t("featured")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link
                      href={`/admin/products/${p.id}`}
                      aria-label={`${tc("edit")} ${p.name_vi}`}
                    >
                      <PencilIcon aria-hidden />
                    </Link>
                  </Button>
                  <ConfirmDelete name={p.name_vi} onConfirm={deleteProduct.bind(null, p.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        basePath="/admin/products"
        params={{
          q: filters.q,
          category: filters.category,
          brand: filters.brand,
          status: filters.status,
          sort: filters.sort,
        }}
        page={filters.page}
        total={total}
        pageSize={ADMIN_PAGE_SIZE}
      />
    </>
  );
}
