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
import { Textarea } from "@/components/ui/textarea";
import { saveBrand } from "@/features/admin/catalog-actions";
import { brandSchema } from "@/features/admin/catalog-schemas";
import { slugify } from "@/lib/search";
import { useAdminSubmit } from "./use-admin-submit";

type Values = z.input<typeof brandSchema>;
type Parsed = z.output<typeof brandSchema>;

export function BrandDialog({ brand }: { brand?: Parsed & { id: string } }) {
  const t = useTranslations("Admin.brands");
  const tc = useTranslations("Admin.common");
  const [open, setOpen] = useState(false);
  const { pending, submit } = useAdminSubmit();
  const form = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(brandSchema),
    defaultValues: brand ?? {
      slug: "",
      name: "",
      logo_url: "",
      description_vi: "",
      description_en: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    submit(
      () => saveBrand(values),
      () => {
        setOpen(false);
        if (!brand) form.reset();
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {brand ? (
          <Button variant="ghost" size="icon-sm" aria-label={`${tc("edit")} ${brand.name}`}>
            <PencilIcon aria-hidden />
          </Button>
        ) : (
          <Button>
            <PlusIcon aria-hidden />
            {t("new")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl" closeLabel={tc("cancel")}>
        <DialogHeader>
          <DialogTitle>{brand ? t("editTitle") : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FormField label={t("name")} error={errors.name} required>
            {(p) => <Input {...p} {...form.register("name")} />}
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
                    form.setValue("slug", slugify(form.getValues("name")), { shouldValidate: true })
                  }
                >
                  <WandSparklesIcon aria-hidden />
                </Button>
              </div>
            )}
          </FormField>
          <FormField label={t("logoUrl")} error={errors.logo_url}>
            {(p) => <Input {...p} type="url" {...form.register("logo_url")} />}
          </FormField>
          <FormField label={t("descriptionVi")} error={errors.description_vi}>
            {(p) => <Textarea {...p} rows={3} {...form.register("description_vi")} />}
          </FormField>
          <FormField label={t("descriptionEn")} error={errors.description_en}>
            {(p) => <Textarea {...p} rows={3} {...form.register("description_en")} />}
          </FormField>
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
