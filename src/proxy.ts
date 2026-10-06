import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createIntlMiddleware(routing);

const localePattern = routing.locales.join("|");
const accountPath = new RegExp(`^/(${localePattern})/account(/|$)`);

function redirectTo(request: NextRequest, response: NextResponse, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = next ? `?next=${encodeURIComponent(next)}` : "";
  const redirect = NextResponse.redirect(url);
  // Keep any refreshed auth cookies.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthRoute = pathname.startsWith("/auth/");

  // /admin and /auth/* live outside the [locale] segment.
  const response =
    isAdmin || isAuthRoute ? NextResponse.next({ request }) : handleI18nRouting(request);

  const { userId, isAdmin: userIsAdmin } = await updateSession(request, response, {
    checkAdmin: isAdmin,
  });

  // Layer 1 of 3 (proxy → admin layout check → RLS).
  if (isAdmin && !userId) {
    return redirectTo(request, response, `/${routing.defaultLocale}/login`, pathname + search);
  }
  if (isAdmin && !userIsAdmin) {
    return redirectTo(request, response, `/${routing.defaultLocale}`);
  }

  const accountMatch = pathname.match(accountPath);
  if (accountMatch && !userId) {
    return redirectTo(request, response, `/${accountMatch[1]}/login`, pathname + search);
  }

  return response;
}

export const config = {
  // Skip API routes, Next internals, Vercel internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
