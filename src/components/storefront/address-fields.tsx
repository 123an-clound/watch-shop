"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { FieldError } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";

type Unit = { c: number; n: string; w: [number, string][] };

let unitsPromise: Promise<Unit[]> | null = null;
/** Static dataset of Vietnam's 2-level units (34 provinces / 3,321 wards), fetched once. */
function loadUnits() {
  unitsPromise ??= fetch("/data/vn-units.json")
    .then((r) => {
      if (!r.ok) throw new Error("units");
      return r.json() as Promise<Unit[]>;
    })
    .catch((e) => {
      unitsPromise = null;
      throw e;
    });
  return unitsPromise;
}

export const selectClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm aria-invalid:border-destructive disabled:opacity-50 dark:bg-input/30";

/** Province → ward cascading selects. Values are stored as display names. */
export function AddressFields({
  province,
  ward,
  onProvinceChange,
  onWardChange,
  errors,
}: {
  province: string;
  ward: string;
  onProvinceChange: (value: string) => void;
  onWardChange: (value: string) => void;
  errors: { province?: FieldError; ward?: FieldError };
}) {
  const t = useTranslations("Checkout");
  const [units, setUnits] = useState<Unit[] | null>(null);

  useEffect(() => {
    let active = true;
    loadUnits()
      .then((u) => active && setUnits(u))
      .catch(() => active && setUnits([]));
    return () => {
      active = false;
    };
  }, []);

  const collator = useMemo(() => new Intl.Collator("vi"), []);
  const provinces = useMemo(
    () => [...(units ?? [])].sort((a, b) => collator.compare(a.n, b.n)),
    [units, collator],
  );
  const wards = useMemo(
    () => provinces.find((p) => p.n === province)?.w ?? [],
    [provinces, province],
  );
  const loading = units === null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label={t("province")} error={errors.province} required>
        {(p) => (
          <select
            {...p}
            name="province"
            autoComplete="address-level1"
            value={province}
            disabled={loading}
            onChange={(e) => {
              onProvinceChange(e.target.value);
              onWardChange("");
            }}
            className={selectClass}
          >
            <option value="">{loading ? t("loadingUnits") : t("selectProvince")}</option>
            {provinces.map((u) => (
              <option key={u.c} value={u.n}>
                {u.n}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label={t("ward")} error={errors.ward} required>
        {(p) => (
          <select
            {...p}
            name="ward"
            autoComplete="address-level2"
            value={ward}
            disabled={!province || loading}
            onChange={(e) => onWardChange(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("selectWard")}</option>
            {wards.map(([code, name]) => (
              <option key={code} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </FormField>
    </div>
  );
}
