# Luxe Watch

Luxury watch store for Vietnam (VI default / EN) with an admin dashboard.
Cash on delivery only, VND only, guest checkout or optional accounts.

**Stack:** Next.js 16 (App Router, RSC, Server Actions, `proxy.ts`) · TypeScript strict ·
Tailwind CSS v4 + shadcn/ui · next-intl · Supabase (Postgres, Auth, Storage, Realtime) ·
zod + react-hook-form · Zustand (cart) · Recharts · Vitest + Playwright.

## Architecture in one page

| Concern          | Where                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Routes           | `src/app/[locale]/(storefront)`, `(auth)`, `src/app/admin`, `src/app/auth/callback`         |
| Data access      | `src/features/<domain>/{queries,actions,schemas,types}.ts`                                  |
| Supabase clients | `src/lib/supabase/{client,server,middleware,admin}.ts` (`admin` = service role, server-only) |
| i18n             | `src/i18n/*`, `messages/{vi,en}.json` (admin UI is Vietnamese)                              |
| DB               | `supabase/migrations/*.sql`, `supabase/seed.sql`, `supabase/tests/orders_check.sql`         |

Key guarantees:

- **Checkout is atomic and server-priced** — `lw_place_order` locks rows, re-reads prices, checks
  stock, writes order/items/history and decrements stock in one transaction. It is callable only
  with the service role from the `placeOrder` Server Action, which sets `user_id` from the verified
  JWT and passes the client IP for rate limiting (5 orders / 10 min per phone or IP).
- **Admin is protected in 3 layers** — `proxy.ts` redirect → `requireAdminPage()` in the admin
  layout / `getAdmin()` in every action → RLS (`lw_is_admin()`).
- **RLS on every table**; guests never read orders directly (tracking goes through
  `lw_get_order_by_code` with a DB rate limiter). Customers cannot change their `role`
  (column-level grants).
- Public catalog queries are cached with `unstable_cache` + tags and invalidated with
  `updateTag` from admin actions.

## Supabase

Hosted on the shared Supabase project **Web-project** (`jtizooyjnllostamffpp`), which also serves
other apps. Every object of this app is prefixed `lw_` (tables, functions, indexes) / `lw-` (storage
buckets). `auth.users` and Auth settings (Site URL, redirect URLs, email templates) are shared.

Migrations were applied to the cloud via the Supabase MCP (`lw_schema`, `lw_rls`, `lw_functions`,
`lw_storage`, `lw_admin_save_product`, `lw_rate_limit`, `lw_admin_reports`), so their version IDs
differ from the local files — apply future migrations the same way rather than `supabase db push`.

**Auth redirect URLs:** add your site URLs (e.g. `http://localhost:3000/**` and
`https://<your-domain>/**`) under Authentication → URL Configuration → Redirect URLs, otherwise
magic-link / password-reset emails fall back to the shared project's Site URL.

## Local setup

```powershell
npm install
npx supabase start                  # local stack on ports 563xx (applies migrations + seed)
Copy-Item .env.example .env.local   # fill with values (hosted project or `npx supabase status`)
npm run dev
```

| Script                                                 | What it does                                                   |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `npm run lint` / `npm run typecheck` / `npm run build` | Quality gates (zero warnings)                                  |
| `npm test`                                             | Vitest unit tests (schemas, utils)                             |
| `npm run test:e2e`                                     | Playwright E2E + axe a11y against the **local** Supabase stack |
| `npm run db:check`                                     | SQL self-check for checkout/order functions + RLS (local)      |
| `npm run db:types:local`                               | Regenerate `src/types/database.types.ts` from the local DB     |

`npm run test:e2e` builds the app with local Supabase env, creates an e2e admin user and runs:
browse → add to cart → guest COD checkout → track order → admin confirms the order.

Reset the local DB (re-runs migrations + seed): `npx supabase db reset`.

## Environment variables

See `.env.example`. Required: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
Optional: `RESEND_API_KEY` + `ORDER_EMAIL_FROM` (order emails), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
`TURNSTILE_SECRET_KEY` (checkout captcha). Public env is validated at build time (`src/env.ts`).

## Promote a user to admin

Sign up normally, then run in the SQL editor:

```sql
update public.lw_profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Deploy (Vercel)

1. Set the environment variables above in the Vercel project (Production + Preview).
   `NEXT_PUBLIC_SITE_URL` must be the public URL (used for canonical, hreflang, sitemap, emails).
2. `npx vercel deploy --prod` (or connect the Git repository).
3. Add the deployed URL to Supabase Auth redirect URLs.

## Windows note

If `next` fails with `ERR_SWC_NATIVE_CACHE`, point SWC at a cache folder with standard permissions:

```powershell
[Environment]::SetEnvironmentVariable("SWC_NATIVE_BINDING_CACHE", "$env:USERPROFILE\.swc-cache", "User")
```

## Known limitations

- Seed product photos are Unsplash placeholders (one shows a different brand's logo) — replace
  them in the admin panel.
- Static CSP allows `'unsafe-inline'` scripts so pages stay statically cacheable; move to nonces in
  `proxy.ts` if a strict CSP is required.
- Lighthouse (mobile, simulated throttling) measured locally: Accessibility 100, Best Practices 96,
  SEO 92 (canonical host mismatch on localhost only), Performance 79–81 (LCP ≈ 5 s simulated).
  The ≥ 95 performance target was not reached locally; re-measure on the deployed URL.
