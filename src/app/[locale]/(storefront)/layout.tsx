import { setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { QuickContact } from "@/components/storefront/quick-contact";

export default async function StorefrontLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <QuickContact />
    </>
  );
}
