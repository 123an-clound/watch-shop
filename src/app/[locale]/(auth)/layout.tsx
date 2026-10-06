import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getSettings } from "@/features/settings/queries";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [settings, tTheme] = await Promise.all([getSettings(), getTranslations("Theme")]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-2xl font-semibold">
          {settings.store_name}
        </Link>
        <ThemeToggle label={tTheme("toggle")} />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
