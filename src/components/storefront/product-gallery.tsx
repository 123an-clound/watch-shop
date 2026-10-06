"use client";

import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { publicImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export type GalleryImage = { path: string; alt: string; width: number; height: number };

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const t = useTranslations("Product");
  const tc = useTranslations("Common");
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[index];
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  if (!current) return <div className="aspect-[4/5] rounded-lg bg-muted" />;

  return (
    <div
      className={cn("grid gap-4 md:gap-5", images.length > 1 && "md:grid-cols-[72px_1fr]")}
      aria-label={t("gallery")}
      role="region"
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openZoom")}
        className="group relative order-first aspect-[4/5] cursor-zoom-in overflow-hidden rounded-lg bg-muted md:order-last"
      >
        <Image
          src={publicImageUrl(current.path)}
          alt={current.alt}
          fill
          preload
          fetchPriority="high"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <span className="absolute right-3 bottom-3 rounded-full bg-background/80 p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomInIcon className="size-4" aria-hidden />
        </span>
      </button>

      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto md:flex-col">
          {images.map((img, i) => (
            <li key={img.path} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("viewImage", { index: i + 1 })}
                aria-current={i === index}
                className={cn(
                  "relative block aspect-[4/5] w-16 overflow-hidden rounded-md border-2 border-transparent md:w-[72px]",
                  i === index && "border-primary",
                )}
              >
                <Image
                  src={publicImageUrl(img.path)}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[min(96vw,1100px)] border-none bg-background p-2 sm:p-4"
          closeLabel={tc("close")}
        >
          <DialogTitle className="sr-only">
            {t("zoomTitle", { name, index: index + 1, total: images.length })}
          </DialogTitle>
          <div
            className="relative aspect-[4/5] max-h-[85vh] w-full cursor-zoom-in overflow-hidden rounded-md bg-muted"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              });
            }}
            onMouseLeave={() => setZoom(null)}
          >
            <Image
              src={publicImageUrl(current.path)}
              alt={current.alt}
              fill
              sizes="96vw"
              className="object-contain transition-transform duration-200 motion-reduce:transition-none"
              style={
                zoom
                  ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : undefined
              }
            />
          </div>
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => go(-1)}
                aria-label={t("prevImage")}
              >
                <ChevronLeftIcon aria-hidden />
              </Button>
              <span className="text-sm tabular-nums">
                {index + 1} / {images.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => go(1)}
                aria-label={t("nextImage")}
              >
                <ChevronRightIcon aria-hidden />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
