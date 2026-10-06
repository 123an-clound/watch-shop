import { HeartIcon, SearchIcon, UserIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { getBrands, getCategories } from "@/features/catalog/queries";
import { getSettings } from "@/features/settings/queries";
import { Link } from "@/i18n/navigation";
import { CartButton } from "./cart-button";
import { CartDrawer } from "./cart-drawer";
import { DesktopNav } from "./desktop-nav";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const [t, tTheme, locale, categories, brands, settings] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Theme"),
    getLocale(),
    getCategories(),
    getBrands(),
    getSettings(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <MobileNav categories={categories} brands={brands} storeName={settings.store_name} />
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-wide whitespace-nowrap sm:text-2xl"
        >
          {settings.store_name}
        </Link>
        <DesktopNav categories={categories} brands={brands} />

        <form
          action={`/${locale}/products`}
          role="search"
          className="relative ml-auto hidden max-w-xs flex-1 md:block"
        >
          <label htmlFor="header-search" className="sr-only">
            {t("search")}
          </label>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="header-search"
            name="q"
            type="search"
            maxLength={100}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:border-ring"
          />
        </form>

        <div className="ml-auto flex items-center md:ml-0">
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/products" aria-label={t("search")}>
              <SearchIcon aria-hidden />
            </Link>
          </Button>
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle label={tTheme("toggle")} />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild>
            <Link href="/account/wishlist" aria-label={t("wishlist")}>
              <HeartIcon aria-hidden />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account" aria-label={t("account")}>
              <UserIcon aria-hidden />
            </Link>
          </Button>
          <CartButton />
        </div>
      </div>
      <CartDrawer freeShippingThreshold={settings.free_shipping_threshold} />
    </header>
  );
}
