"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, WandSparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { discardUploads, saveProduct } from "@/features/admin/catalog-actions";
import {
  productSchema,
  type ProductInput,
  type ProductOutput,
} from "@/features/admin/catalog-schemas";
import { slugify } from "@/lib/search";
import { FeaturesEditor } from "./features-editor";
import { ImageManager } from "./image-manager";
import { useAdminSubmit } from "./use-admin-submit";

type Option = { id: string; name: string };

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-input/30";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-4 font-sans text-base font-semibold">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function ProductForm({
  initial,
  categories,
  brands,
}: {
  initial?: ProductInput & { id: string };
  categories: Option[];
  brands: Option[];
}) {
  const t = useTranslations("Admin.products");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const { pending, submit } = useAdminSubmit();
  // Stable mutable set of paths uploaded during this form session.
  const [sessionUploads] = useState(() => new Set<string>());

  const form = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ?? {
      slug: "",
      sku: "",
      name_vi: "",
      name_en: "",
      description_vi: "",
      description_en: "",
      price: 0,
      compare_at_price: "",
      stock: 0,
      category_id: "",
      brand_id: "",
      features: [],
      is_featured: false,
      is_active: true,
      seo_title_vi: "",
      seo_title_en: "",
      seo_description_vi: "",
      seo_description_en: "",
      images: [],
    },
  });
  const { errors } = form.formState;

  // Delete files uploaded in this session if the form is left without saving.
  useEffect(() => {
    return () => {
      if (sessionUploads.size) void discardUploads([...sessionUploads]);
    };
  }, [sessionUploads]);

  const onSubmit = form.handleSubmit((values) =>
    submit(
      () => saveProduct(values),
      ({ id }) => {
        sessionUploads.clear();
        if (!initial) router.replace(`/admin/products/${id}`);
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-end gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {Object.keys(errors).length > 0 && (
          <p className="mr-auto text-sm text-destructive" role="alert">
            {tc("fixErrors")}
          </p>
        )}
        {initial && (
          <Button variant="outline" asChild>
            <Link href={`/vi/products/${initial.slug}`} target="_blank">
              <ExternalLinkIcon aria-hidden />
              {t("viewOnStore")}
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/admin/products">{t("backToList")}</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid min-w-0 content-start gap-6">
          <Section title={t("content")}>
            <Tabs defaultValue="vi">
              <TabsList>
                <TabsTrigger value="vi">{tc("vietnamese")}</TabsTrigger>
                <TabsTrigger value="en">{tc("english")}</TabsTrigger>
              </TabsList>
              <TabsContent
                value="vi"
                forceMount
                className="grid gap-4 pt-4 data-[state=inactive]:hidden"
              >
                <FormField label={t("nameVi")} error={errors.name_vi} required>
                  {(p) => <Input {...p} {...form.register("name_vi")} />}
                </FormField>
                <FormField label={t("descriptionVi")} error={errors.description_vi}>
                  {(p) => <Textarea {...p} rows={6} {...form.register("description_vi")} />}
                </FormField>
              </TabsContent>
              <TabsContent
                value="en"
                forceMount
                className="grid gap-4 pt-4 data-[state=inactive]:hidden"
              >
                <FormField label={t("nameEn")} error={errors.name_en} required>
                  {(p) => <Input {...p} {...form.register("name_en")} />}
                </FormField>
                <FormField label={t("descriptionEn")} error={errors.description_en}>
                  {(p) => <Textarea {...p} rows={6} {...form.register("description_en")} />}
                </FormField>
              </TabsContent>
            </Tabs>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("slug")} error={errors.slug} required>
                {(p) => (
                  <div className="flex gap-2">
                    <Input {...p} {...form.register("slug")} />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={tc("generateSlug")}
                      onClick={() =>
                        form.setValue("slug", slugify(form.getValues("name_vi")), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <WandSparklesIcon aria-hidden />
                    </Button>
                  </div>
                )}
              </FormField>
              <FormField label={t("sku")} error={errors.sku} required>
                {(p) => <Input {...p} className="font-mono" {...form.register("sku")} />}
              </FormField>
            </div>
          </Section>

          <Section title={t("images")}>
            <ImageManager
              control={form.control}
              register={form.register}
              onUploaded={(path) => sessionUploads.add(path)}
              onRemovedUpload={(path) => {
                if (sessionUploads.delete(path)) void discardUploads([path]);
              }}
            />
          </Section>

          <Section title={t("features")}>
            <FeaturesEditor
              control={form.control}
              register={form.register}
              errors={errors.features}
            />
          </Section>

          <Section title={t("seo")}>
            <p className="-mt-2 text-xs text-muted-foreground">{t("seoHint")}</p>
            <Tabs defaultValue="vi">
              <TabsList>
                <TabsTrigger value="vi">{tc("vietnamese")}</TabsTrigger>
                <TabsTrigger value="en">{tc("english")}</TabsTrigger>
              </TabsList>
              {(["vi", "en"] as const).map((l) => (
                <TabsContent
                  key={l}
                  value={l}
                  forceMount
                  className="grid gap-4 pt-4 data-[state=inactive]:hidden"
                >
                  <FormField
                    label={l === "vi" ? t("seoTitleVi") : t("seoTitleEn")}
                    error={errors[`seo_title_${l}`]}
                  >
                    {(p) => <Input {...p} maxLength={120} {...form.register(`seo_title_${l}`)} />}
                  </FormField>
                  <FormField
                    label={l === "vi" ? t("seoDescriptionVi") : t("seoDescriptionEn")}
                    error={errors[`seo_description_${l}`]}
                  >
                    {(p) => (
                      <Textarea
                        {...p}
                        rows={3}
                        maxLength={320}
                        {...form.register(`seo_description_${l}`)}
                      />
                    )}
                  </FormField>
                </TabsContent>
              ))}
            </Tabs>
          </Section>
        </div>

        <div className="grid content-start gap-6">
          <Section title={t("visibility")}>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="is_active">{t("active")}</Label>
                    <p className="text-xs text-muted-foreground">{t("activeHint")}</p>
                  </div>
                  <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="is_featured">{t("featured")}</Label>
                    <p className="text-xs text-muted-foreground">{t("featuredHint")}</p>
                  </div>
                  <Switch id="is_featured" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </Section>

          <Section title={t("pricing")}>
            <FormField label={t("price")} error={errors.price} required>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={0}
                  step={1000}
                  {...form.register("price", { valueAsNumber: true })}
                />
              )}
            </FormField>
            <FormField label={t("compareAtPrice")} error={errors.compare_at_price}>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={0}
                  step={1000}
                  {...form.register("compare_at_price")}
                />
              )}
            </FormField>
            <FormField label={t("stock")} error={errors.stock} required>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={0}
                  {...form.register("stock", { valueAsNumber: true })}
                />
              )}
            </FormField>
          </Section>

          <Section title={t("organization")}>
            <FormField label={t("category")} error={errors.category_id}>
              {(p) => (
                <select {...p} {...form.register("category_id")} className={selectClass}>
                  <option value="">{tc("none")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label={t("brand")} error={errors.brand_id}>
              {(p) => (
                <select {...p} {...form.register("brand_id")} className={selectClass}>
                  <option value="">{tc("none")}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </Section>
        </div>
      </div>
    </form>
  );
}
