"use client";

import {
  BoxIcon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
  ShoppingCartIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/orders", key: "orders", icon: ShoppingCartIcon },
  { href: "/admin/products", key: "products", icon: BoxIcon },
  { href: "/admin/categories", key: "categories", icon: FolderTreeIcon },
  { href: "/admin/brands", key: "brands", icon: TagIcon },
  { href: "/admin/customers", key: "customers", icon: UsersIcon },
  { href: "/admin/settings", key: "settings", icon: SettingsIcon },
] as const;

function NavLinks({ onNavigate, badge }: { onNavigate?: () => void; badge?: React.ReactNode }) {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();

  return (
    <ul className="grid gap-1">
      {items.map(({ href, key, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                active && "bg-sidebar-accent font-medium text-sidebar-primary",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(key)}
              {key === "orders" && badge}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar({ badge }: { badge?: React.ReactNode }) {
  const t = useTranslations("Admin.nav");
  return (
    <nav aria-label={t("menu")}>
      <NavLinks badge={badge} />
    </nav>
  );
}

export function AdminMobileNav({
  storeName,
  badge,
}: {
  storeName: string;
  badge?: React.ReactNode;
}) {
  const t = useTranslations("Admin.nav");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("menu")}>
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72" closeLabel={tc("close")}>
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">{storeName}</SheetTitle>
        </SheetHeader>
        <nav aria-label={t("menu")} className="px-3">
          <NavLinks badge={badge} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
