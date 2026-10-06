import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoryDialog } from "@/components/admin/category-dialog";
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
import { deleteCategory } from "@/features/admin/catalog-actions";
import { adminListCategories } from "@/features/admin/catalog-queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.categories");
  return { title: t("title") };
}

export default async function AdminCategoriesPage() {
  const [t, tc, categories] = await Promise.all([
    getTranslations("Admin.categories"),
    getTranslations("Admin.common"),
    adminListCategories(),
  ]);
  const parents = categories.map(({ id, name_vi }) => ({ id, name_vi }));
  const nameOf = (id: string | null) => categories.find((c) => c.id === id)?.name_vi ?? "—";

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <CategoryDialog parents={parents} />
      </PageHeader>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("nameVi")}</TableHead>
              <TableHead>{t("nameEn")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead>{t("parent")}</TableHead>
              <TableHead className="text-right">{t("sortOrder")}</TableHead>
              <TableHead className="text-right">{t("products")}</TableHead>
              <TableHead className="w-24 text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {tc("empty")}
                </TableCell>
              </TableRow>
            )}
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name_vi}</TableCell>
                <TableCell>{c.name_en}</TableCell>
                <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                <TableCell>{nameOf(c.parent_id)}</TableCell>
                <TableCell className="text-right tabular-nums">{c.sort_order}</TableCell>
                <TableCell className="text-right tabular-nums">{c.productCount}</TableCell>
                <TableCell className="text-right">
                  <CategoryDialog
                    parents={parents}
                    category={{ ...c, parent_id: c.parent_id ?? "" }}
                  />
                  <ConfirmDelete name={c.name_vi} onConfirm={deleteCategory.bind(null, c.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
