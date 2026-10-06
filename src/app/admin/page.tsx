import { getTranslations } from "next-intl/server";

// Replaced by the dashboard in Phase 7.
export default async function AdminHome() {
  const t = await getTranslations("Admin.nav");
  return <h1 className="text-3xl">{t("dashboard")}</h1>;
}
