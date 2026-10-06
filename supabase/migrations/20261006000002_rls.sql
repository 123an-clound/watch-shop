-- =====================================================================
-- Row Level Security
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  )
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.checkout_attempts enable row level security;
alter table public.wishlists enable row level security;
alter table public.addresses enable row level security;
alter table public.site_settings enable row level security;

-- ---------------------------------------------------------------------
-- profiles: own row (role column not updatable by clients) / admin read
-- ---------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Column-level privilege: customers can only change name/phone, never role.
-- Promote admins with SQL (see README).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Public catalog: read for everyone, write for admin
-- ---------------------------------------------------------------------
create policy "categories_select_all" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_insert_admin" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories_update_admin" on public.categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories_delete_admin" on public.categories
  for delete to authenticated using ((select public.is_admin()));

create policy "brands_select_all" on public.brands
  for select to anon, authenticated using (true);
create policy "brands_insert_admin" on public.brands
  for insert to authenticated with check ((select public.is_admin()));
create policy "brands_update_admin" on public.brands
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "brands_delete_admin" on public.brands
  for delete to authenticated using ((select public.is_admin()));

create policy "products_select_active_or_admin" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products_insert_admin" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products_update_admin" on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products_delete_admin" on public.products
  for delete to authenticated using ((select public.is_admin()));

create policy "product_images_select_active_or_admin" on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
    or (select public.is_admin())
  );
create policy "product_images_insert_admin" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_images_update_admin" on public.product_images
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images_delete_admin" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

create policy "site_settings_select_all" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings_update_admin" on public.site_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Orders: no direct inserts (place_order RPC only). Owners read, admin reads/updates.
-- Status changes go through update_order_status / cancel_order.
-- ---------------------------------------------------------------------
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

create policy "order_status_history_select_own_or_admin" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.order_status_history from anon, authenticated;
revoke all on public.checkout_attempts from anon, authenticated;

-- ---------------------------------------------------------------------
-- Customer-owned data
-- ---------------------------------------------------------------------
create policy "wishlists_select_own" on public.wishlists
  for select to authenticated using (user_id = (select auth.uid()));
create policy "wishlists_insert_own" on public.wishlists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "wishlists_delete_own" on public.wishlists
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "addresses_select_own" on public.addresses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "addresses_insert_own" on public.addresses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "addresses_update_own" on public.addresses
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "addresses_delete_own" on public.addresses
  for delete to authenticated using (user_id = (select auth.uid()));

-- Anonymous users never touch customer-owned tables.
revoke all on public.wishlists from anon;
revoke all on public.addresses from anon;
revoke all on public.profiles from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.order_status_history from anon;
