import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getBrands, getCategories } from "@/features/catalog/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.products");
  return { title: t("new") };
}

export default async function NewProductPage() {
  const [t, categories, brands] = await Promise.all([
    getTranslations("Admin.products"),
    getCategories(),
    getBrands(),
  ]);

  return (
    <>
      <PageHeader title={t("new")} />
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name_vi }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </>
  );
}
