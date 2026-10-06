import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderStatusBadge, OrderTimeline } from "@/components/shared/order-status";
import { getMyOrder } from "@/features/account/queries";
import { ORDER_CODE_REGEX } from "@/features/orders/schemas";
import { Link } from "@/i18n/navigation";
import { formatDate, formatVND } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/orders/[code]">): Promise<Metadata> {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("orderDetail", { code }) };
}

export default async function AccountOrderPage({
  params,
}: PageProps<"/[locale]/account/orders/[code]">) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  if (!ORDER_CODE_REGEX.test(code)) notFound();
  const [t, tCart, order] = await Promise.all([
    getTranslations("Account"),
    getTranslations("Cart"),
    getMyOrder(code),
  ]);
  if (!order) notFound();
  const a = order.shipping_address;

  return (
    <section className="grid gap-8">
      <div>
        <Link href="/account/orders" className="text-sm text-primary hover:underline">
          ← {t("backToOrders")}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl">{order.order_code}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.created_at, locale)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="grid content-start gap-6">
          <section>
            <h2 className="mb-3 font-sans text-sm font-semibold">{t("items")}</h2>
            <ul className="divide-y rounded-lg border">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 p-3">
                  <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-muted">
                    {i.image_path && (
                      <Image
                        src={publicImageUrl(i.image_path)}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <p>{i.product_name}</p>
                    <p className="text-muted-foreground">
                      {formatVND(i.unit_price)} × {i.quantity}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">{formatVND(i.unit_price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt>{tCart("subtotal")}</dt>
                <dd className="tabular-nums">{formatVND(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{tCart("shipping")}</dt>
                <dd className="tabular-nums">
                  {order.shipping_fee === 0 ? tCart("shippingFree") : formatVND(order.shipping_fee)}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>{tCart("total")}</dt>
                <dd className="tabular-nums">{formatVND(order.total)}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2 className="mb-2 font-sans text-sm font-semibold">{t("shipTo")}</h2>
            <address className="text-sm text-muted-foreground not-italic">
              {order.customer_name} · {order.customer_phone}
              <br />
              {a.street}, {a.ward}, {a.province}
              {a.note && (
                <>
                  <br />
                  {a.note}
                </>
              )}
            </address>
          </section>
        </div>
        <section>
          <h2 className="mb-4 font-sans text-sm font-semibold">{t("timeline")}</h2>
          <OrderTimeline history={order.history} />
        </section>
      </div>
    </section>
  );
}
