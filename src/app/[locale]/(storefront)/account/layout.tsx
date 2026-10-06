import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/account-nav";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { getProfile } from "@/features/account/queries";
import { redirect } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({
  children,
  params,
}: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Proxy already redirects guests; this re-checks on the server (defense in depth).
  const profile = await getProfile();
  if (!profile) {
    return redirect({
      href: { pathname: "/login", query: { next: `/${locale}/account` } },
      locale,
    });
  }
  const t = await getTranslations("Account");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("title")}</p>
          <p className="mt-2 font-heading text-3xl">
            {t("greeting", { name: profile.fullName || profile.email || "" })}
          </p>
        </div>
        <SignOutButton redirectTo={`/${locale}`} variant="outline" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
