# Luxe Watch

Luxury watch store (VI/EN) + admin dashboard. Next.js 16 (App Router) · Supabase · Tailwind v4 · shadcn/ui · next-intl.

## Local setup

```powershell
npm install
npx supabase start            # local stack on ports 563xx (applies migrations + seed)
Copy-Item .env.example .env.local   # fill with values printed by `npx supabase status`
npm run dev
```

Useful scripts:

| Script                                                 | What it does                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| `npm run lint` / `npm run typecheck` / `npm run build` | Quality gates (zero warnings)                                     |
| `npm run db:types:local`                               | Regenerate `src/types/database.types.ts` from the local DB        |
| `npm run db:types`                                     | Same, from the hosted project (run `npx supabase link` first)     |
| `npm run db:check`                                     | Run the SQL self-check for checkout/order functions + RLS (local) |

Reset the local DB (re-runs migrations + seed): `npx supabase db reset`.

## Promote a user to admin

Sign up normally, then run in the SQL editor (or `psql`):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Clients cannot change `role` themselves (column-level privilege).

## Windows note

If `next` fails with `ERR_SWC_NATIVE_CACHE`, point SWC at a cache folder with standard permissions:

```powershell
[Environment]::SetEnvironmentVariable("SWC_NATIVE_BINDING_CACHE", "$env:USERPROFILE\.swc-cache", "User")
```
