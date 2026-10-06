"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, WandSparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { saveCategory } from "@/features/admin/catalog-actions";
import { categorySchema } from "@/features/admin/catalog-schemas";
import { slugify } from "@/lib/search";
import { useAdminSubmit } from "./use-admin-submit";

type Values = z.input<typeof categorySchema>;
type Parsed = z.output<typeof categorySchema>;

export function CategoryDialog({
  category,
  parents,
}: {
  category?: Parsed & { id: string };
  parents: { id: string; name_vi: string }[];
}) {
  const t = useTranslations("Admin.categories");
  const tc = useTranslations("Admin.common");
  const [open, setOpen] = useState(false);
  const { pending, submit } = useAdminSubmit();
  const form = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ?? { slug: "", name_vi: "", name_en: "", parent_id: "", sort_order: 0 },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    submit(
      () => saveCategory(values),
      () => {
        setOpen(false);
        if (!category) form.reset();
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {category ? (
          <Button variant="ghost" size="icon-sm" aria-label={`${tc("edit")} ${category.name_vi}`}>
            <PencilIcon aria-hidden />
          </Button>
        ) : (
          <Button>
            <PlusIcon aria-hidden />
            {t("new")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent closeLabel={tc("cancel")}>
        <DialogHeader>
          <DialogTitle>{category ? t("editTitle") : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FormField label={t("nameVi")} error={errors.name_vi} required>
            {(p) => <Input {...p} {...form.register("name_vi")} />}
          </FormField>
          <FormField label={t("nameEn")} error={errors.name_en} required>
            {(p) => <Input {...p} {...form.register("name_en")} />}
          </FormField>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("parent")} error={errors.parent_id}>
              {(p) => (
                <select
                  {...p}
                  {...form.register("parent_id")}
                  className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm dark:bg-input/30"
                >
                  <option value="">{tc("none")}</option>
                  {parents
                    .filter((c) => c.id !== category?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_vi}
                      </option>
                    ))}
                </select>
              )}
            </FormField>
            <FormField label={t("sortOrder")} error={errors.sort_order}>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={0}
                  {...form.register("sort_order", { valueAsNumber: true })}
                />
              )}
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
