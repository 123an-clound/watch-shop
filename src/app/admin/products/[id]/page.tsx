import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { deleteProduct } from "@/features/admin/catalog-actions";
import { adminGetProduct } from "@/features/admin/catalog-queries";
import { getBrands, getCategories } from "@/features/catalog/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.products");
  return { title: t("editTitle") };
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [t, product, categories, brands] = await Promise.all([
    getTranslations("Admin.products"),
    adminGetProduct(id),
    getCategories(),
    getBrands(),
  ]);
  if (!product) notFound();

  const { images, features, ...rest } = product;

  return (
    <>
      <PageHeader title={product.name_vi} description={t("editTitle")}>
        <ConfirmDelete
          name={product.name_vi}
          onConfirm={deleteProduct.bind(null, product.id)}
          redirectTo="/admin/products"
          iconOnly={false}
        />
      </PageHeader>
      <ProductForm
        initial={{
          ...rest,
          description_vi: rest.description_vi ?? "",
          description_en: rest.description_en ?? "",
          compare_at_price: rest.compare_at_price ?? "",
          category_id: rest.category_id ?? "",
          brand_id: rest.brand_id ?? "",
          seo_title_vi: rest.seo_title_vi ?? "",
          seo_title_en: rest.seo_title_en ?? "",
          seo_description_vi: rest.seo_description_vi ?? "",
          seo_description_en: rest.seo_description_en ?? "",
          features: Object.entries(features).map(([key, value]) => ({ key, value: String(value) })),
          images: [...images]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(({ storage_path, alt_vi, alt_en, width, height }) => ({
              storage_path,
              alt_vi: alt_vi ?? "",
              alt_en: alt_en ?? "",
              width,
              height,
            })),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name_vi }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </>
  );
}
