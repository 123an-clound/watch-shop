import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { Link } from "@/i18n/navigation";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return pageMetadata({
    locale,
    path: "/login",
    title: t("loginTitle"),
    description: t("loginSubtitle"),
    noIndex: true,
  });
}

export default async function Page({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const { next, error } = await searchParams;
  const tErrors = await getTranslations("Errors");
  return (
    <>
      <AuthHeader title={t("loginTitle")} subtitle={t("loginSubtitle")} />
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          {tErrors("authCallback")}
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary hover:underline">
          {t("registerLink")}
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">{t("guestNote")}</p>
    </>
  );
}
