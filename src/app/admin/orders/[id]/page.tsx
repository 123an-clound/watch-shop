import { PrinterIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, OrderTimeline } from "@/components/shared/order-status";
import { Button } from "@/components/ui/button";
import { adminGetOrder } from "@/features/admin/order-queries";
import { formatDate, formatVND } from "@/lib/format";
import { publicImageUrl } from "@/lib/images";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("title") };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-4 font-sans text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [t, order] = await Promise.all([getTranslations("Admin.orders"), adminGetOrder(id)]);
  if (!order) notFound();
  const a = order.shipping_address;

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-primary hover:underline">
        ← {t("backToList")}
      </Link>
      <div className="mt-3">
        <PageHeader title={order.order_code} description={formatDate(order.created_at, "vi")}>
          <OrderStatusBadge status={order.status} />
          <Button variant="outline" asChild>
            <Link href={`/admin/orders/${order.id}/print`} target="_blank">
              <PrinterIcon aria-hidden />
              {t("print")}
            </Link>
          </Button>
        </PageHeader>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          <Card title={t("items")}>
            <ul className="divide-y">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
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
                    {i.product_id ? (
                      <Link href={`/admin/products/${i.product_id}`} className="hover:text-primary">
                        {i.product_name}
                      </Link>
                    ) : (
                      <p>{i.product_name}</p>
                    )}
                    <p className="font-mono text-xs text-muted-foreground">{i.sku}</p>
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatVND(i.unit_price)} × {i.quantity}
                  </p>
                  <p className="w-32 text-right text-sm tabular-nums">
                    {formatVND(i.unit_price * i.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid gap-2 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt>{t("subtotal")}</dt>
                <dd className="tabular-nums">{formatVND(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("shippingFee")}</dt>
                <dd className="tabular-nums">{formatVND(order.shipping_fee)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>{t("grandTotal")}</dt>
                <dd className="tabular-nums">{formatVND(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title={t("history")}>
            <OrderTimeline history={order.history} />
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title={t("updateStatus")}>
            <OrderStatusForm orderId={order.id} code={order.order_code} status={order.status} />
          </Card>
          <Card title={t("customerInfo")}>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("customer")}</dt>
                <dd>
                  {order.customer_name} · {order.user_id ? t("account") : t("guest")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("phone")}</dt>
                <dd>
                  <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                    {order.customer_phone}
                  </a>
                </dd>
              </div>
              {order.customer_email && (
                <div>
                  <dt className="text-muted-foreground">{t("email")}</dt>
                  <dd>
                    <a href={`mailto:${order.customer_email}`} className="hover:underline">
                      {order.customer_email}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">{t("shippingAddress")}</dt>
                <dd>
                  {a.street}, {a.ward}, {a.province}
                </dd>
              </div>
              {a.note && (
                <div>
                  <dt className="text-muted-foreground">{t("note")}</dt>
                  <dd className="whitespace-pre-line">{a.note}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">{t("payment")}</dt>
                <dd>{t("cod")}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
