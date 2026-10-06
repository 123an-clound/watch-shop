import { CircleCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ORDER_CODE_REGEX } from "@/features/orders/schemas";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout/success">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Checkout" });
  return pageMetadata({
    locale,
    path: "/checkout/success",
    title: t("successTitle"),
    description: t("successBody"),
    noIndex: true,
  });
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/checkout/success">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");
  const { code } = await searchParams;
  const orderCode = typeof code === "string" && ORDER_CODE_REGEX.test(code) ? code : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <CircleCheckIcon className="size-14 text-success" aria-hidden />
      <h1 className="mt-6 text-4xl">{t("successTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("successBody")}</p>
      {orderCode && (
        <div className="mt-8 w-full rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("orderCode")}</p>
          <p className="mt-1 font-mono text-2xl tracking-wider text-primary">{orderCode}</p>
          <p className="mt-3 text-xs text-muted-foreground">{t("successHint")}</p>
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link
            href={
              orderCode ? { pathname: "/track-order", query: { code: orderCode } } : "/track-order"
            }
          >
            {t("trackCta")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">{t("continue")}</Link>
        </Button>
      </div>
    </div>
  );
}
