import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/features/auth/components/auth-forms";
import { Link } from "@/i18n/navigation";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return pageMetadata({
    locale,
    path: "/forgot-password",
    title: t("forgotTitle"),
    description: t("forgotSubtitle"),
    noIndex: true,
  });
}

export default async function Page({ params }: PageProps<"/[locale]/forgot-password">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <>
      <AuthHeader title={t("forgotTitle")} subtitle={t("forgotSubtitle")} />
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </>
  );
}
