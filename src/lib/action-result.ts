export type ErrorCode =
  | "generic"
  | "invalidInput"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "userExists"
  | "weakPassword"
  | "rateLimited"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "outOfStock"
  | "productUnavailable"
  | "captcha"
  | "duplicate"
  | "notEligible";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ErrorCode };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: ErrorCode): { ok: false; error: ErrorCode } => ({
  ok: false,
  error,
});

/** Only allow same-origin relative redirects ("/vi/account"), never "//evil.com". */
export function safeNext(next: string | null | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
