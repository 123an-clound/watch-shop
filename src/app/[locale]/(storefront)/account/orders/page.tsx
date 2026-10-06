import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderStatusBadge } from "@/components/shared/order-status";
import { Button } from "@/components/ui/button";
import { getMyOrders } from "@/features/account/queries";
import { Link } from "@/i18n/navigation";
import { formatDate, formatVND } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/orders">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("orders") };
}

export default async function AccountOrdersPage({ params }: PageProps<"/[locale]/account/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, orders] = await Promise.all([getTranslations("Account"), getMyOrders()]);

  return (
    <section>
      <h1 className="text-2xl">{t("orders")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("ordersDescription")}</p>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {t("noOrders")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
              <Link
                href={`/account/orders/${o.order_code}`}
                className="font-mono text-primary hover:underline"
              >
                {o.order_code}
              </Link>
              <span className="text-sm text-muted-foreground">
                {formatDate(o.created_at, locale)}
              </span>
              <OrderStatusBadge status={o.status} />
              <span className="ml-auto font-medium tabular-nums">{formatVND(o.total)}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/account/orders/${o.order_code}`}
                  aria-label={`${t("view")} ${o.order_code}`}
                >
                  {t("view")}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
