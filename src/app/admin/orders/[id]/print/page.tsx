import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PrintButton } from "@/components/admin/print-button";
import { adminGetOrder } from "@/features/admin/order-queries";
import { getSettings } from "@/features/settings/queries";
import { formatDate, formatVND } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("printTitle") };
}

/** Packing slip: printable on A4/A5; admin chrome is hidden via print: utilities. */
export default async function PackingSlipPage({ params }: PageProps<"/admin/orders/[id]/print">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [t, order, settings] = await Promise.all([
    getTranslations("Admin.orders"),
    adminGetOrder(id),
    getSettings(),
  ]);
  if (!order) notFound();
  const a = order.shipping_address;

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-black print:max-w-none print:p-0 [&_*]:border-neutral-300">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-neutral-600">{t("printHint")}</p>
        <PrintButton label={t("print")} />
      </div>
      <header className="flex items-start justify-between border-b pb-4">
        <div>
          <p className="font-heading text-2xl">{settings.store_name}</p>
          <p className="text-xs text-neutral-600">
            {settings.address} · {settings.contact_phone}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-widest text-neutral-600 uppercase">{t("printTitle")}</p>
          <p className="font-mono text-lg">{order.order_code}</p>
          <p className="text-xs text-neutral-600">{formatDate(order.created_at, "vi")}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 border-b py-4 text-sm">
        <div>
          <p className="text-xs text-neutral-600 uppercase">{t("customer")}</p>
          <p className="font-medium">{order.customer_name}</p>
          <p>{order.customer_phone}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-600 uppercase">{t("shippingAddress")}</p>
          <p>
            {a.street}, {a.ward}, {a.province}
          </p>
          {a.note && <p className="mt-1 italic">{a.note}</p>}
        </div>
      </section>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-neutral-600 uppercase">
            <th className="py-2">{t("items")}</th>
            <th className="py-2">{t("sku")}</th>
            <th className="py-2 text-right">{t("qty")}</th>
            <th className="py-2 text-right">{t("unitPrice")}</th>
            <th className="py-2 text-right">{t("amount")}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="py-2">{i.product_name}</td>
              <td className="py-2 font-mono text-xs">{i.sku}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatVND(i.unit_price)}</td>
              <td className="py-2 text-right tabular-nums">
                {formatVND(i.unit_price * i.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto grid w-72 gap-1 text-sm">
        <div className="flex justify-between">
          <dt>{t("subtotal")}</dt>
          <dd className="tabular-nums">{formatVND(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{t("shippingFee")}</dt>
          <dd className="tabular-nums">{formatVND(order.shipping_fee)}</dd>
        </div>
        <div className="flex justify-between border-t pt-1 text-base font-bold">
          <dt>{t("collect")}</dt>
          <dd className="tabular-nums">{formatVND(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-16 grid grid-cols-2 text-center text-sm">
        <div />
        <div>
          <p className="text-neutral-600">{t("signature")}</p>
          <div className="mt-16 border-t" />
        </div>
      </div>
    </div>
  );
}
