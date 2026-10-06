# PROJECT MASTER PLAN — LUXURY WATCH E-COMMERCE (VI/EN) + ADMIN DASHBOARD

> **To Claude Code:** You are a senior full-stack engineer (Next.js App Router, Supabase, TypeScript, Tailwind, shadcn/ui). Build a **production-ready** luxury watch store: polished UI, fast, SEO-optimized, secure, accessible. Read this whole document before writing any code. Work phase by phase (Section 9) and obey the Definition of Done (Section 10).

---

## 0. BUSINESS CONTEXT (fixed decisions — do not change)
- **Market:** Vietnam. **Languages:** Vietnamese (default) + English.
- **Currency:** VND only (store as integer, no decimals). Format with `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` in both locales.
- **Payment:** **Cash on Delivery (COD) only.** No payment gateway.
- **Customers:** **Guest checkout AND optional accounts** (login, order history, wishlist, saved addresses).
- **Admin:** single role `admin` (store owner/staff), managed via `profiles.role`.
- **Hosting:** Vercel (frontend) + Supabase (DB, Auth, Storage, Realtime).

---

## 1. TECH STACK
| Concern | Choice |
|---|---|
| Framework | Latest stable **Next.js** (App Router, RSC, Server Actions), TypeScript `strict` |
| Styling/UI | Tailwind CSS v4 + shadcn/ui + Lucide icons; `sonner` for toasts |
| i18n | `next-intl` with locale-prefixed routes `/vi/...`, `/en/...` (default `vi`) |
| Data/Auth/Storage | Supabase + `@supabase/ssr` (browser, server, middleware clients) + service-role client (server-only) |
| Validation | `zod` (shared schemas for forms + server actions) + `react-hook-form` |
| Client state | Zustand with `persist` (cart only) |
| Animation | CSS transitions; `motion` only where it adds real value (respect `prefers-reduced-motion`) |
| Charts (admin) | Recharts (via shadcn chart) |
| Email (optional) | Resend + React Email for order confirmation |
| Testing | Vitest (utils/schemas) + Playwright (critical flows) |
| Tooling | ESLint, Prettier, `supabase gen types` for DB types |

Before installing, check current stable versions and their docs; do not use deprecated APIs. If the Supabase / Vercel MCP tools are available, use them for migrations, type generation and deployment. If a frontend-design skill is available, read it before building UI.

---

## 2. DATABASE SCHEMA (Supabase / PostgreSQL)
Write everything as versioned SQL migrations in `supabase/migrations/`. Add `created_at`/`updated_at` (with trigger) to every table.

1. **`profiles`** — `id uuid PK → auth.users.id`, `full_name`, `phone`, `role text check ('customer','admin') default 'customer'`. Auto-create via trigger on `auth.users` insert.
2. **`categories`** — `id`, `slug unique`, `name_vi`, `name_en`, `parent_id nullable`, `sort_order`.
3. **`brands`** — `id`, `slug unique`, `name`, `logo_url`, `description_vi`, `description_en`.
4. **`products`** — `id`, `slug unique`, `sku unique`, `name_vi`, `name_en`, `description_vi`, `description_en`, `price bigint` (VND), `compare_at_price bigint nullable`, `stock int check (stock >= 0)`, `category_id FK`, `brand_id FK`, `features jsonb` (e.g. `{"movement":"Automatic","case_size":"42mm","water_resistance":"100m"}`), `is_featured bool`, `is_active bool`, `seo_title_vi/en`, `seo_description_vi/en`, `search_vector tsvector` (generated).
5. **`product_images`** — `id`, `product_id FK on delete cascade`, `storage_path`, `alt_vi`, `alt_en`, `sort_order`, `width`, `height`. (Replaces `image_urls[]` — supports ordering, alt text, dimensions for CLS-free rendering.)
6. **`orders`** — `id`, `order_code text unique` (human-readable, e.g. `LW-250106-4F7K`), `user_id nullable FK` (null = guest), `customer_name`, `customer_phone`, `customer_email nullable`, `shipping_address jsonb` (`{province, ward, street, note}` — Vietnam 2-level administrative units), `subtotal bigint`, `shipping_fee bigint`, `total bigint`, `payment_method text default 'cod'`, `status text check ('pending','confirmed','shipping','delivered','cancelled')`, `locale`.
7. **`order_items`** — `id`, `order_id FK`, `product_id FK nullable`, snapshot fields: `product_name`, `sku`, `image_path`, `unit_price bigint`, `quantity int check (>0)`.
8. **`order_status_history`** — `order_id`, `from_status`, `to_status`, `changed_by`, `note`, `created_at`.
9. **`wishlists`** — `user_id`, `product_id`, PK(user_id, product_id).
10. **`addresses`** — saved addresses per user.
11. **`site_settings`** — singleton (`id int PK check (id = 1)`): `store_name`, `hero_image_path`, `hero_title_vi/en`, `hero_subtitle_vi/en`, `contact_email`, `contact_phone`, `address`, `social_links jsonb`, `shipping_fee bigint`, `free_shipping_threshold bigint`.

**Indexes:** FKs, `products(is_active, is_featured)`, `products(category_id)`, `products(brand_id)`, `products(price)`, GIN on `search_vector` and `features`, `orders(status, created_at desc)`, `orders(user_id)`.

**Atomic checkout:** create Postgres function `place_order(payload jsonb)` (`security definer`, fixed `search_path`) that in ONE transaction: locks product rows (`for update`), validates `is_active` + stock, **recomputes prices from DB (never trust client prices)**, inserts order + items, decrements stock, writes status history, returns `order_code`. Admin cancelling an order restores stock (function `cancel_order`).

**Seed:** `supabase/seed.sql` with 4 categories, 6 brands, ~16 realistic watches (bilingual text, features), 1 settings row. Document how to promote a user to admin.

---

## 3. SECURITY (mandatory)
- **RLS enabled on every table.** Helper `public.is_admin()` (`security definer`, `stable`). Policies:
  - Public: read active products, images, categories, brands, settings.
  - Customers: read/update own profile (cannot change `role`), own orders/items, own wishlist/addresses.
  - Guests: **no direct table access** to orders; orders are created only via `place_order` RPC called from a Server Action. Guest order lookup = `order_code` + `phone` via a server-side function.
  - Admin: full access via `is_admin()`.
- **Storage:** bucket `products` (public read; insert/update/delete admin only), allowed MIME `image/jpeg|png|webp|avif`, max 5 MB. Bucket `site` same rules.
- Service-role key **only** in server-only modules (`import 'server-only'`); never exposed to client. Env vars validated at startup with zod (`src/env.ts`). Provide `.env.example`.
- Every Server Action: zod-validate input, re-check auth/role server-side (do not rely on middleware alone), return typed `{ ok, error }` results; never leak raw DB errors to the client.
- Admin protection in 3 layers: middleware redirect → admin layout server check → RLS.
- Checkout anti-spam: honeypot field + rate limit per IP/phone (e.g. max 5 orders / 10 min, implemented in DB or Upstash) + Cloudflare Turnstile (optional, toggle by env).
- Security headers in `next.config` (CSP with Supabase domains, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS). `poweredByHeader: false`.
- Validate Vietnamese phone numbers (`^(0|\+84)(3|5|7|8|9)\d{8}$`). Escape/limit all user text lengths.
- Run Supabase security advisors after migrations and fix all warnings.

---

## 4. SEO (mandatory)
- Locale-prefixed URLs with `hreflang` alternates + `x-default`, canonical on every page.
- Slug-based URLs: `/[locale]/products/[slug]`, `/[locale]/brands/[slug]`, `/[locale]/categories/[slug]` (no UUIDs in public URLs).
- `generateMetadata` on every page (title template `%s | {store_name}`, description, Open Graph, Twitter card). Dynamic OG images for products (`opengraph-image.tsx`).
- JSON-LD: `Organization` + `WebSite` (with SearchAction) on home, `Product` (+ `Offer` in VND, availability) on product page, `BreadcrumbList` on listing/detail pages.
- `app/sitemap.ts` (all locales, products, categories, brands, `lastModified`) and `app/robots.ts` (disallow `/admin`, `/account`, `/cart`, `/checkout`).
- Semantic HTML: one `h1` per page, proper heading order, descriptive alt text (bilingual), breadcrumbs UI.
- Filtering/sorting via URL search params (shareable, crawlable); listing pages with params use canonical to the clean URL.
- Custom `not-found.tsx` and `error.tsx` per locale.

---

## 5. PERFORMANCE (target: Lighthouse ≥ 95 all categories on mobile, CLS < 0.05, LCP < 2.5s)
- Server Components by default; `"use client"` only for interactive leaves.
- Caching: cache public queries with tags (`products`, `product:{slug}`, `settings`) and call `revalidateTag` from admin Server Actions. Use `generateStaticParams` for product/category pages.
- `next/image` everywhere with Supabase `remotePatterns`, correct `sizes`, stored `width/height`, `priority` only for the hero/LCP image, AVIF/WebP.
- Client-side image compression/resizing before upload in admin (max 2000px, WebP).
- `next/font` with **Vietnamese subset**: Playfair Display (headings) + Inter or Be Vietnam Pro (body). Verify diacritics render correctly.
- Streaming with `Suspense` + skeletons; paginate listings (e.g. 12/page) and admin tables (server-side pagination).
- Dynamic import heavy client components (charts, image zoom, rich editors). Keep client JS minimal; check bundle with `@next/bundle-analyzer`.
- Avoid N+1 queries; select only needed columns.

---

## 6. UI / UX DESIGN SYSTEM
- **Aesthetic:** dark luxury by default (near-black backgrounds, warm gold accent, muted silver text), generous whitespace, editorial typography, subtle hover/scale transitions, high-quality 4:5 / 1:1 product imagery. Optional light mode toggle.
- Define design tokens (CSS variables) for colors, radii, spacing; all components use tokens — no hard-coded colors.
- **Mobile-first**, fully responsive (360px → 1920px). Sticky header with mega-menu on desktop, sheet menu on mobile.
- **Accessibility:** WCAG 2.2 AA contrast, keyboard navigation, visible focus rings, ARIA labels, `prefers-reduced-motion`.
- Every data view has **loading, empty, and error states**. Toasts for every mutation result.
- Language switcher keeps the current page. All UI strings in `messages/vi.json` and `messages/en.json` (no hard-coded text).

---

## 7. FEATURES

### Storefront
- **Home:** hero (from `site_settings`), featured products, shop by brand, shop by category, brand story section, trust badges (authentic, warranty, COD, free shipping threshold).
- **Product listing:** filter by category, brand, price range, features (movement, case size…); sort (newest, price asc/desc); full-text search; pagination; all synced to URL.
- **Product detail:** image gallery with thumbnails + zoom/lightbox, price + compare-at price, stock status, quantity selector, add to cart, wishlist button, specs table from `features`, related products, breadcrumbs.
- **Cart:** sliding drawer + full cart page; Zustand persisted; re-validate prices/stock from server on cart page and checkout; free-shipping progress bar.
- **Checkout (COD):** guest or logged-in (prefill saved address); fields: name, phone, email (optional), province → ward selects (static JSON dataset of Vietnam's current 2-level units), street, note; order summary; submit → `place_order` → success page with `order_code`.
- **Order tracking:** `/track-order` (order_code + phone) for guests.
- **Account:** sign up / login (email+password, magic link, Google OAuth optional), forgot password, profile, saved addresses, order history + detail, wishlist.
- Static pages: About, Warranty & Returns policy, Shipping policy, Contact (bilingual, content in messages or settings).

### Admin (`/admin`, Vietnamese UI is enough)
- **Dashboard:** revenue (delivered orders), orders by status, today/7d/30d stats, revenue chart, low-stock list, latest orders.
- **Products:** data table (search, filter, sort, paginate), create/edit form with bilingual tabs, slug auto-generate (Vietnamese diacritic-safe), multi-image upload (drag & drop, reorder, delete, alt text), **key-value editor for `features`** (no raw JSON typing), SEO fields, active/featured toggles. Upload images first, then save record; clean up orphaned files on failure/delete.
- **Categories & Brands:** CRUD.
- **Orders:** table with status filter + search; detail view; update status (validated transitions, writes history); cancel restores stock; **Supabase Realtime** toast + badge for new orders; print packing slip.
- **Customers:** list with order count / total spent.
- **Settings:** edit `site_settings` incl. hero image upload, shipping fee, free-shipping threshold.

---

## 8. FOLDER STRUCTURE
```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (storefront)/   home, products, products/[slug], categories/[slug], brands/[slug],
│   │   │                   cart, checkout, checkout/success, track-order, account/*, (static pages)
│   │   ├── (auth)/         login, register, forgot-password
│   │   └── layout.tsx      NextIntlClientProvider, header, footer
│   ├── admin/              layout.tsx (sidebar + server auth guard), page.tsx, products, categories,
│   │                       brands, orders, customers, settings
│   ├── auth/callback/      Supabase OAuth / magic-link callback
│   ├── sitemap.ts, robots.ts, manifest.ts
├── components/  ui/ (shadcn) · storefront/ · admin/ · shared/
├── features/    <domain>/{actions.ts, queries.ts, schemas.ts, types.ts}  (products, orders, cart, auth, settings)
├── lib/         supabase/{client,server,middleware,admin}.ts · utils.ts · format.ts · seo.ts
├── i18n/        routing.ts, request.ts
├── store/       cart-store.ts
├── types/       database.types.ts (generated)
├── env.ts
└── middleware.ts   (next-intl + Supabase session refresh + /admin guard)
messages/ vi.json, en.json
supabase/ migrations/, seed.sql
tests/   e2e/ (Playwright), unit/ (Vitest)
```

---

## 9. EXECUTION PHASES
**Execute one phase at a time. At the end of each phase: run checks (Section 10), commit with a clear message, print a short summary (done / files changed / anything I must do manually, e.g. env vars), then wait for my "continue".** Start with a brief plan of the whole project before Phase 1.

1. **Setup:** init project, Tailwind, shadcn, next-intl, ESLint/Prettier, env validation, security headers, Supabase clients, middleware. Migrations (schema, indexes, RLS, functions, triggers, storage buckets + policies), seed, generated types.
2. **Design system & layouts:** tokens, fonts, root + storefront layout (header, mega-menu, mobile menu, language switcher, footer), admin layout + sidebar + 3-layer auth guard, auth pages, error/404 pages.
3. **Admin catalog:** categories, brands, products CRUD with image upload, features editor, revalidation.
4. **Storefront browsing:** home, listing with filters/search/pagination, product detail, brand/category pages, full SEO (metadata, JSON-LD, sitemap, robots, OG images).
5. **Cart & checkout:** Zustand cart + drawer, cart page with server re-validation, COD checkout with `place_order`, success page, order tracking, anti-spam, optional Resend confirmation email.
6. **Accounts:** profile, addresses, order history, wishlist.
7. **Admin orders & dashboard:** orders management, status history, cancel/restore stock, realtime notifications, customers, settings, dashboard stats/charts.
8. **Hardening & launch:** Playwright e2e (browse → add to cart → guest checkout → admin sees order → status update), Vitest for schemas/utils, Lighthouse audit + fixes, accessibility audit, Supabase advisors, README (setup, env, admin promotion, deploy), deploy to Vercel.

---

## 10. DEFINITION OF DONE (every phase)
- `npm run lint`, `npm run typecheck` (`tsc --noEmit`) and `npm run build` pass with **zero errors and zero warnings**; relevant tests pass.
- No `any`, no unused code, no `console.log`, no hard-coded UI strings or secrets.
- All DB calls wrapped in `try/catch` with user-facing toast + server-side logging.
- New pages are responsive, accessible, have loading/empty/error states, and correct metadata.
- If something is ambiguous or a decision would change architecture/scope, **ask me instead of guessing**.

---
**Claude Code: confirm you understood, list any questions, then wait for "Start Phase 1".**
