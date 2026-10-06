const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

/** VND amounts are stored as integers (no decimals). */
export function formatVND(amount: number) {
  return vnd.format(amount);
}

export function formatDate(value: string | Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
