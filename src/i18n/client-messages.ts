import type { AbstractIntlMessages } from "next-intl";

/** Namespaces used by client components — everything else stays on the server. */
export const STOREFRONT_CLIENT_NAMESPACES = [
  "Common",
  "Nav",
  "Theme",
  "Language",
  "Cart",
  "Validation",
  "Errors",
  "Auth",
  "Product",
  "Products",
  "Error",
  "Checkout",
  "Account",
  "Track",
  "Status",
];

export const ADMIN_CLIENT_NAMESPACES = [
  "Admin",
  "Common",
  "Theme",
  "Validation",
  "Errors",
  "Auth",
  "Error",
  "Status",
];

export function pickMessages(messages: AbstractIntlMessages, namespaces: string[]) {
  return Object.fromEntries(
    namespaces.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]]),
  );
}
