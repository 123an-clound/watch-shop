"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductInput, ProductOutput } from "@/features/admin/catalog-schemas";

const PRESETS = [
  "movement",
  "case_size",
  "case_material",
  "water_resistance",
  "crystal",
  "strap_material",
];

/** Key-value editor for product `features` — no raw JSON typing. */
export function FeaturesEditor({
  control,
  register,
  errors,
}: {
  control: Control<ProductInput, unknown, ProductOutput>;
  register: UseFormRegister<ProductInput>;
  errors?: FieldErrors<ProductInput>["features"];
}) {
  const t = useTranslations("Admin.products");
  const tLabels = useTranslations("Admin.featureLabels");
  const tv = useTranslations("Validation");
  const { fields, append, remove } = useFieldArray({ control, name: "features" });
  const usedKeys = new Set(fields.map((f) => f.key));
  const rootError = errors?.root?.message ?? errors?.message;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("featurePresets")}:</span>
        {PRESETS.filter((k) => !usedKeys.has(k)).map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => append({ key, value: "" })}
          >
            <PlusIcon aria-hidden />
            {tLabels(key)}
          </Button>
        ))}
      </div>

      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_1.5fr_auto] gap-2 text-xs text-muted-foreground">
          <span>{t("featureKey")}</span>
          <span>{t("featureValue")}</span>
          <span className="sr-only">{t("removeFeature")}</span>
        </div>
      )}
      {fields.map((field, index) => {
        const err = errors?.[index];
        return (
          <div key={field.id} className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-2">
            <div>
              <Input
                aria-label={`${t("featureKey")} ${index + 1}`}
                aria-invalid={Boolean(err?.key)}
                placeholder="movement"
                className="font-mono text-xs"
                {...register(`features.${index}.key`)}
              />
              {err?.key?.message && (
                <p className="mt-1 text-xs text-destructive">{tv(err.key.message)}</p>
              )}
            </div>
            <div>
              <Input
                aria-label={`${t("featureValue")} ${index + 1}`}
                aria-invalid={Boolean(err?.value)}
                {...register(`features.${index}.value`)}
              />
              {err?.value?.message && (
                <p className="mt-1 text-xs text-destructive">{tv(err.value.message)}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${t("removeFeature")} ${index + 1}`}
              onClick={() => remove(index)}
            >
              <Trash2Icon aria-hidden />
            </Button>
          </div>
        );
      })}
      {rootError && (
        <p className="text-sm text-destructive" role="alert">
          {tv(rootError)}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() => append({ key: "", value: "" })}
      >
        <PlusIcon aria-hidden />
        {t("addFeature")}
      </Button>
    </div>
  );
}
