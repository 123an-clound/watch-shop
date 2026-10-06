import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/auth-forms";
import { Link } from "@/i18n/navigation";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return pageMetadata({
    locale,
    path: "/register",
    title: t("registerTitle"),
    description: t("registerSubtitle"),
    noIndex: true,
  });
}

export default async function Page({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <>
      <AuthHeader title={t("registerTitle")} subtitle={t("registerSubtitle")} />
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </>
  );
}
