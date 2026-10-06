import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BrandDialog } from "@/components/admin/brand-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteBrand } from "@/features/admin/catalog-actions";
import { adminListBrands } from "@/features/admin/catalog-queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.brands");
  return { title: t("title") };
}

export default async function AdminBrandsPage() {
  const [t, tc, brands] = await Promise.all([
    getTranslations("Admin.brands"),
    getTranslations("Admin.common"),
    adminListBrands(),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <BrandDialog />
      </PageHeader>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("descriptionVi")}</TableHead>
              <TableHead className="text-right">{t("products")}</TableHead>
              <TableHead className="w-24 text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {tc("empty")}
                </TableCell>
              </TableRow>
            )}
            {brands.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="font-mono text-xs">{b.slug}</TableCell>
                <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                  {b.description_vi}
                </TableCell>
                <TableCell className="text-right tabular-nums">{b.productCount}</TableCell>
                <TableCell className="text-right">
                  <BrandDialog
                    brand={{
                      ...b,
                      logo_url: b.logo_url ?? "",
                      description_vi: b.description_vi ?? "",
                      description_en: b.description_en ?? "",
                    }}
                  />
                  <ConfirmDelete name={b.name} onConfirm={deleteBrand.bind(null, b.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
