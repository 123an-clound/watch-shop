"use client";

import { MenuIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Brand, Category } from "@/features/catalog/types";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/i18n-utils";

export function MobileNav({
  categories,
  brands,
  storeName,
}: {
  categories: Category[];
  brands: Brand[];
  storeName: string;
}) {
  const t = useTranslations("Nav");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const item = "block rounded-md px-3 py-2.5 text-base hover:bg-accent";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-sm overflow-y-auto"
        closeLabel={tc("close")}
      >
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">{storeName}</SheetTitle>
        </SheetHeader>
        <nav aria-label={t("mainMenu")} className="flex flex-col gap-6 px-4 pb-8">
          <Link href="/products" onClick={close} className={`${item} font-medium`}>
            {t("allWatches")}
          </Link>
          <div>
            <p className="eyebrow mb-2 px-3">{t("categories")}</p>
            {categories.map((c) => (
              <Link key={c.id} href={`/categories/${c.slug}`} onClick={close} className={item}>
                {pick(c, "name", locale)}
              </Link>
            ))}
          </div>
          <div>
            <p className="eyebrow mb-2 px-3">{t("brands")}</p>
            {brands.map((b) => (
              <Link key={b.id} href={`/brands/${b.slug}`} onClick={close} className={item}>
                {b.name}
              </Link>
            ))}
          </div>
          <div className="border-t pt-4">
            <Link href="/about" onClick={close} className={item}>
              {t("about")}
            </Link>
            <Link href="/contact" onClick={close} className={item}>
              {t("contact")}
            </Link>
            <Link href="/track-order" onClick={close} className={item}>
              {t("trackOrder")}
            </Link>
            <Link href="/account" onClick={close} className={item}>
              {t("account")}
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
