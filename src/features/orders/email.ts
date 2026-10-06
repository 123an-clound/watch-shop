import "server-only";
import { serverEnv } from "@/env.server";
import { formatVND } from "@/lib/format";
import { localeUrl } from "@/lib/seo";
import { logServerError } from "@/lib/server-log";

type Item = { product_name: string; quantity: number; unit_price: number };

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/**
 * Order confirmation via Resend's HTTP API. Optional: silently skipped when
 * RESEND_API_KEY / ORDER_EMAIL_FROM are not configured. Never blocks checkout.
 */
export async function sendOrderConfirmation(input: {
  to: string;
  locale: "vi" | "en";
  storeName: string;
  orderCode: string;
  customerName: string;
  items: Item[];
  total: number;
}) {
  const { RESEND_API_KEY: key, ORDER_EMAIL_FROM: from } = serverEnv;
  if (!key || !from) return;

  const vi = input.locale === "vi";
  const subject = vi
    ? `Xác nhận đơn hàng ${input.orderCode} — ${input.storeName}`
    : `Order confirmation ${input.orderCode} — ${input.storeName}`;
  const rows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escape(i.product_name)} × ${i.quantity}</td><td style="padding:6px 0;text-align:right">${formatVND(i.unit_price * i.quantity)}</td></tr>`,
    )
    .join("");
  const trackUrl = localeUrl(input.locale, "/track-order");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1c1917">
<h1 style="font-size:22px">${escape(input.storeName)}</h1>
<p>${vi ? "Xin chào" : "Hello"} ${escape(input.customerName)},</p>
<p>${vi ? "Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là" : "Thank you for your order. Your order code is"} <strong>${input.orderCode}</strong>.</p>
<table style="width:100%;border-collapse:collapse">${rows}<tr><td style="padding:8px 0;border-top:1px solid #ddd"><strong>${vi ? "Tổng cộng" : "Total"}</strong></td><td style="padding:8px 0;border-top:1px solid #ddd;text-align:right"><strong>${formatVND(input.total)}</strong></td></tr></table>
<p>${vi ? "Thanh toán khi nhận hàng (COD)." : "Payment: cash on delivery (COD)."}</p>
<p><a href="${trackUrl}">${vi ? "Tra cứu đơn hàng" : "Track your order"}</a></p></div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) logServerError("email.orderConfirmation", await res.text());
  } catch (e) {
    logServerError("email.orderConfirmation", e);
  }
}
