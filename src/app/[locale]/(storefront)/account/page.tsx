import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileForm } from "@/components/account/profile-form";
import { getProfile } from "@/features/account/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("profile") };
}

export default async function AccountProfilePage({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, profile] = await Promise.all([getTranslations("Account"), getProfile()]);
  if (!profile) return null;

  return (
    <section>
      <h1 className="text-2xl">{t("profile")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("profileDescription")}</p>
      <ProfileForm
        email={profile.email ?? ""}
        defaults={{ fullName: profile.fullName, phone: profile.phone }}
      />
    </section>
  );
}
