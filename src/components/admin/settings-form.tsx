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
  const tc = useTranslations("Admin.common");
  const { pending, submit } = useAdminSubmit();
  const [uploading, setUploading] = useState(0);
  const form = useForm<SettingsInput, unknown, Output>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });
  const { errors } = form.formState;

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
            <ImageField
              label={t("heroImage")}
              hint={t("heroImageHint")}
              value={hero.value}
              onChange={hero.onChange}
              onUploading={(d) => setUploading((n) => n + d)}
              aspect="aspect-[16/7]"
            />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {field("hero_title_vi", t("heroTitleVi"))}
          {field("hero_title_en", t("heroTitleEn"))}
          {field("hero_subtitle_vi", t("heroSubtitleVi"), { textarea: true })}
          {field("hero_subtitle_en", t("heroSubtitleEn"), { textarea: true })}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-sans text-base font-semibold">{t("team")}</h2>
        <Controller
          control={form.control}
          name="team_image_path"
          render={({ field: team }) => (
            <ImageField
              label={t("teamImage")}
              hint={t("teamImageHint")}
              value={team.value}
              onChange={team.onChange}
              onUploading={(d) => setUploading((n) => n + d)}
              aspect="aspect-[3/2]"
            />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {field("team_caption_vi", t("teamCaptionVi"))}
          {field("team_caption_en", t("teamCaptionEn"))}
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
        <Button type="submit" disabled={pending || uploading > 0}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </div>
    </form>
  );
}

/** Single image setting: compress to WebP, upload to the site bucket, store the path. */
function ImageField({
  label,
  hint,
  value,
  onChange,
  onUploading,
  aspect,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (path: string | null) => void;
  onUploading: (delta: 1 | -1) => void;
  aspect: string;
}) {
  const t = useTranslations("Admin.settings");
  const tp = useTranslations("Admin.products");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    onUploading(1);
    try {
      const { blob } = await compressImage(file);
      const path = `${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from(SITE_BUCKET)
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;
      onChange(path);
    } catch {
      toast.error(tp("uploadFailed", { name: file.name }));
    } finally {
      setBusy(false);
      onUploading(-1);
    }
  }

  return (
    <div className="mb-4 grid gap-3">
      <p className="text-sm font-medium">{label}</p>
      <div
        className={`relative ${aspect} w-full max-w-xl overflow-hidden rounded-lg border bg-muted`}
      >
        {value && (
          <Image
            src={publicImageUrl(value, SITE_BUCKET)}
            alt=""
            fill
            sizes="576px"
            className="object-cover"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          aria-label={`${t("changeImage")} — ${label}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <ImagePlusIcon aria-hidden />
          )}
          {t("changeImage")}
        </Button>
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            <Trash2Icon aria-hidden />
            {t("removeImage")}
          </Button>
        )}
      </div>
    </div>
  );
}
