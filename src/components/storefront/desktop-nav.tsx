"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { Brand, Category } from "@/features/catalog/types";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/i18n-utils";

const linkClass =
  "block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent";

export function DesktopNav({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  const t = useTranslations("Nav");
  const locale = useLocale();

  return (
    <NavigationMenu aria-label={t("mainMenu")} className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">{t("products")}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[640px] grid-cols-[1fr_1fr_1.2fr] gap-6 p-6">
              <div>
                <p className="eyebrow mb-3">{t("shopByCategory")}</p>
                <ul>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <NavigationMenuLink asChild>
                        <Link href={`/categories/${c.slug}`} className={linkClass}>
                          {pick(c, "name", locale)}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">{t("shopByBrand")}</p>
                <ul>
                  {brands.map((b) => (
                    <li key={b.id}>
                      <NavigationMenuLink asChild>
                        <Link href={`/brands/${b.slug}`} className={linkClass}>
                          {b.name}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>
              <NavigationMenuLink asChild>
                <Link
                  href="/products"
                  className="flex flex-col justify-end rounded-md border bg-gradient-to-br from-accent to-card p-5 transition-colors hover:border-primary/60"
                >
                  <span className="font-heading text-xl">{t("allWatches")}</span>
                  <span className="mt-1 text-sm text-primary">{t("products")} →</span>
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">{t("brands")}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[420px] grid-cols-2 gap-1 p-4">
              {brands.map((b) => (
                <li key={b.id}>
                  <NavigationMenuLink asChild>
                    <Link href={`/brands/${b.slug}`} className={linkClass}>
                      {b.name}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/about"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t("about")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/contact"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t("contact")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
