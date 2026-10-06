"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlusIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/features/admin/settings-actions";
import { settingsSchema, type SettingsInput } from "@/features/admin/settings-schemas";
import { ACCEPTED_IMAGE_TYPES, compressImage } from "@/lib/image-compress";
import { publicImageUrl, SITE_BUCKET } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { useAdminSubmit } from "./use-admin-submit";

type Output = z.output<typeof settingsSchema>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-4 font-sans text-base font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("Admin.settings");
  const tp = useTranslations("Admin.products");
  const tc = useTranslations("Admin.common");
  const { pending, submit } = useAdminSubmit();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<SettingsInput, unknown, Output>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });
  const { errors } = form.formState;

  async function uploadHero(file: File) {
    setUploading(true);
    try {
      const { blob } = await compressImage(file);
      const path = `${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from(SITE_BUCKET)
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;
      form.setValue("hero_image_path", path, { shouldDirty: true });
    } catch {
      toast.error(tp("uploadFailed", { name: file.name }));
    } finally {
      setUploading(false);
    }
  }

  const onSubmit = form.handleSubmit((values) => submit(() => saveSettings(values)));
  const field = (
    name: keyof SettingsInput,
    label: string,
    opts: { type?: string; textarea?: boolean; required?: boolean } = {},
  ) => (
    <FormField label={label} error={errors[name]} required={opts.required}>
      {(p) =>
        opts.textarea ? (
          <Textarea {...p} rows={3} {...form.register(name)} />
        ) : (
          <Input {...p} type={opts.type ?? "text"} {...form.register(name)} />
        )
      }
    </FormField>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-4xl gap-6">
      <Section title={t("store")}>
        {field("store_name", t("storeName"), { required: true })}
        {field("contact_email", t("contactEmail"), { type: "email" })}
        {field("contact_phone", t("contactPhone"), { type: "tel" })}
        {field("address", t("address"))}
      </Section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-sans text-base font-semibold">{t("hero")}</h2>
        <Controller
          control={form.control}
          name="hero_image_path"
          render={({ field: hero }) => (
            <div className="mb-4 grid gap-3">
              <p className="text-sm font-medium">{t("heroImage")}</p>
              <div className="relative aspect-[16/7] w-full max-w-xl overflow-hidden rounded-lg border bg-muted">
                {hero.value && (
                  <Image
                    src={publicImageUrl(hero.value, SITE_BUCKET)}
                    alt=""
                    fill
                    sizes="576px"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("heroImageHint")}</p>
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="sr-only"
                  aria-label={t("changeImage")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadHero(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2Icon className="animate-spin" aria-hidden />
                  ) : (
                    <ImagePlusIcon aria-hidden />
                  )}
                  {t("changeImage")}
                </Button>
                {hero.value && (
                  <Button type="button" variant="ghost" onClick={() => hero.onChange(null)}>
                    <Trash2Icon aria-hidden />
                    {t("removeImage")}
                  </Button>
                )}
              </div>
            </div>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {field("hero_title_vi", t("heroTitleVi"))}
          {field("hero_title_en", t("heroTitleEn"))}
          {field("hero_subtitle_vi", t("heroSubtitleVi"), { textarea: true })}
          {field("hero_subtitle_en", t("heroSubtitleEn"), { textarea: true })}
        </div>
      </section>

      <Section title={t("shipping")}>
        {field("shipping_fee", t("shippingFee"), { type: "number", required: true })}
        {field("free_shipping_threshold", t("freeShippingThreshold"), {
          type: "number",
          required: true,
        })}
      </Section>

      <Section title={t("social")}>
        {field("facebook", t("facebook"), { type: "url" })}
        {field("instagram", t("instagram"), { type: "url" })}
        {field("zalo", t("zalo"), { type: "url" })}
        {field("youtube", t("youtube"), { type: "url" })}
      </Section>

      <div>
        <Button type="submit" disabled={pending || uploading}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </div>
    </form>
  );
}
