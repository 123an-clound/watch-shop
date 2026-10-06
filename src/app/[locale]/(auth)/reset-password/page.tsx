import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/features/auth/components/auth-forms";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return pageMetadata({
    locale,
    path: "/reset-password",
    title: t("resetTitle"),
    description: t("resetSubtitle"),
    noIndex: true,
  });
}

export default async function Page({ params }: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <>
      <AuthHeader title={t("resetTitle")} subtitle={t("resetSubtitle")} />
      <ResetPasswordForm />
    </>
  );
}
