"use client";

import { HeartIcon, MapPinIcon, PackageIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", key: "profile", icon: UserIcon },
  { href: "/account/orders", key: "orders", icon: PackageIcon },
  { href: "/account/addresses", key: "addresses", icon: MapPinIcon },
  { href: "/account/wishlist", key: "wishlist", icon: HeartIcon },
] as const;

export function AccountNav() {
  const t = useTranslations("Account");
  const pathname = usePathname();

  return (
    <nav aria-label={t("nav")}>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map(({ href, key, icon: Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap hover:bg-accent",
                  active && "bg-accent font-medium text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
