import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import Link from "next/link";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";
import { NewOrderBadge, NewOrderListener } from "@/components/admin/new-order-notifier";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Providers } from "@/components/shared/providers";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireAdminPage } from "@/features/admin/auth";
import { ADMIN_CLIENT_NAMESPACES, pickMessages } from "@/i18n/client-messages";
import { getSettings } from "@/features/settings/queries";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const [t, tNav, tTheme, settings, messages] = await Promise.all([
    getTranslations("Admin"),
    getTranslations("Admin.nav"),
    getTranslations("Theme"),
    getSettings(),
    getMessages(),
  ]);
  const badge = <NewOrderBadge />;

  return (
    <html
      lang="vi"
      className={`${fontDisplay.variable} ${fontBody.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <NextIntlClientProvider
          locale="vi"
          messages={pickMessages(messages, ADMIN_CLIENT_NAMESPACES)}
        >
          <Providers>
            <NewOrderListener />
            <div className="flex min-h-screen">
              <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex print:hidden">
                <Link href="/admin" className="mb-6 px-3 font-heading text-xl">
                  {settings.store_name}
                </Link>
                <AdminSidebar badge={badge} />
              </aside>
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur print:hidden">
                  <AdminMobileNav storeName={settings.store_name} badge={badge} />
                  <p className="truncate text-sm text-muted-foreground">
                    {t("signedInAs", { name: admin.name })}
                  </p>
                  <div className="ml-auto flex items-center gap-1">
                    <Link
                      href="/vi"
                      className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
                    >
                      {tNav("viewStore")}
                    </Link>
                    <ThemeToggle label={tTheme("toggle")} />
                    <SignOutButton redirectTo="/vi/login" />
                  </div>
                </header>
                <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
