"use client";

import { ArrowDownIcon, ArrowUpIcon, ImagePlusIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { type Control, type UseFormRegister, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductInput, ProductOutput } from "@/features/admin/catalog-schemas";
import { ACCEPTED_IMAGE_TYPES, compressImage } from "@/lib/image-compress";
import { PRODUCT_BUCKET, publicImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Upload → compress (WebP ≤2000px) → Storage, then keep the path in form state.
 * `onUploaded` / `onRemovedUpload` let the form track files that must be cleaned up
 * if the product is never saved.
 */
export function ImageManager({
  control,
  register,
  onUploaded,
  onRemovedUpload,
}: {
  control: Control<ProductInput, unknown, ProductOutput>;
  register: UseFormRegister<ProductInput>;
  onUploaded: (path: string) => void;
  onRemovedUpload: (path: string) => void;
}) {
  const t = useTranslations("Admin.products");
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 20 - fields.length);
    if (!list.length) return;
    const supabase = createClient();
    setUploading((n) => n + list.length);

    await Promise.all(
      list.map(async (file) => {
        try {
          const { blob, width, height } = await compressImage(file);
          const path = `${crypto.randomUUID()}.webp`;
          const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });
          if (error) throw error;
          onUploaded(path);
          append({ storage_path: path, alt_vi: "", alt_en: "", width, height });
        } catch (e) {
          const reason = e instanceof Error ? e.message : "";
          toast.error(
            reason === "type"
              ? t("fileType", { name: file.name })
              : reason === "size"
                ? t("fileTooLarge", { name: file.name })
                : t("uploadFailed", { name: file.name }),
          );
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  return (
    <div className="grid gap-4">
      <div
        onDragOver={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
        )}
      >
        <p className="max-w-lg text-sm text-muted-foreground">{t("imagesHint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="sr-only"
          id="product-image-upload"
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
        >
          {uploading > 0 ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <ImagePlusIcon aria-hidden />
          )}
          {uploading > 0 ? t("uploading") : t("uploadImages")}
        </Button>
      </div>

      {fields.length > 0 && (
        <ol className="grid gap-3">
          {fields.map((field, index) => (
            <li
              key={field.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={cn(
                "grid grid-cols-[72px_1fr_auto] items-start gap-3 rounded-lg border bg-card p-3",
                dragIndex === index && "opacity-50",
              )}
            >
              <div className="relative aspect-[4/5] w-[72px] cursor-grab overflow-hidden rounded-md bg-muted">
                <Image
                  src={publicImageUrl(field.storage_path)}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>
              <div className="grid gap-2">
                {index === 0 && <Badge className="w-fit">{t("primary")}</Badge>}
                <Input
                  aria-label={`${t("altVi")} ${index + 1}`}
                  placeholder={t("altVi")}
                  {...register(`images.${index}.alt_vi`)}
                />
                <Input
                  aria-label={`${t("altEn")} ${index + 1}`}
                  placeholder={t("altEn")}
                  {...register(`images.${index}.alt_en`)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("moveUp")}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUpIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("moveDown")}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDownIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("removeImage")}
                  onClick={() => {
                    onRemovedUpload(field.storage_path);
                    remove(index);
                  }}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
