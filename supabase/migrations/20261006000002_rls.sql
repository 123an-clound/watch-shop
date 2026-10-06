-- =====================================================================
-- Row Level Security
-- =====================================================================

create or replace function public.lw_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lw_profiles
    where id = (select auth.uid()) and role = 'admin'
  )
$$;

revoke execute on function public.lw_is_admin() from public;
grant execute on function public.lw_is_admin() to anon, authenticated;

alter table public.lw_profiles enable row level security;
alter table public.lw_categories enable row level security;
alter table public.lw_brands enable row level security;
alter table public.lw_products enable row level security;
alter table public.lw_product_images enable row level security;
alter table public.lw_orders enable row level security;
alter table public.lw_order_items enable row level security;
alter table public.lw_order_status_history enable row level security;
alter table public.lw_checkout_attempts enable row level security;
alter table public.lw_wishlists enable row level security;
alter table public.lw_addresses enable row level security;
alter table public.lw_site_settings enable row level security;

-- ---------------------------------------------------------------------
-- profiles: own row (role column not updatable by clients) / admin read
-- ---------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.lw_profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.lw_is_admin()));

create policy "profiles_update_own" on public.lw_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Column-level privilege: customers can only change name/phone, never role.
-- Promote admins with SQL (see README).
revoke insert, update, delete on public.lw_profiles from anon, authenticated;
grant update (full_name, phone) on public.lw_profiles to authenticated;

-- ---------------------------------------------------------------------
-- Public catalog: read for everyone, write for admin
-- ---------------------------------------------------------------------
create policy "categories_select_all" on public.lw_categories
  for select to anon, authenticated using (true);
create policy "categories_insert_admin" on public.lw_categories
  for insert to authenticated with check ((select public.lw_is_admin()));
create policy "categories_update_admin" on public.lw_categories
  for update to authenticated
  using ((select public.lw_is_admin())) with check ((select public.lw_is_admin()));
create policy "categories_delete_admin" on public.lw_categories
  for delete to authenticated using ((select public.lw_is_admin()));

create policy "brands_select_all" on public.lw_brands
  for select to anon, authenticated using (true);
create policy "brands_insert_admin" on public.lw_brands
  for insert to authenticated with check ((select public.lw_is_admin()));
create policy "brands_update_admin" on public.lw_brands
  for update to authenticated
  using ((select public.lw_is_admin())) with check ((select public.lw_is_admin()));
create policy "brands_delete_admin" on public.lw_brands
  for delete to authenticated using ((select public.lw_is_admin()));

create policy "products_select_active_or_admin" on public.lw_products
  for select to anon, authenticated
  using (is_active or (select public.lw_is_admin()));
create policy "products_insert_admin" on public.lw_products
  for insert to authenticated with check ((select public.lw_is_admin()));
create policy "products_update_admin" on public.lw_products
  for update to authenticated
  using ((select public.lw_is_admin())) with check ((select public.lw_is_admin()));
create policy "products_delete_admin" on public.lw_products
  for delete to authenticated using ((select public.lw_is_admin()));

create policy "product_images_select_active_or_admin" on public.lw_product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.lw_products p
      where p.id = product_id and p.is_active
    )
    or (select public.lw_is_admin())
  );
create policy "product_images_insert_admin" on public.lw_product_images
  for insert to authenticated with check ((select public.lw_is_admin()));
create policy "product_images_update_admin" on public.lw_product_images
  for update to authenticated
  using ((select public.lw_is_admin())) with check ((select public.lw_is_admin()));
create policy "product_images_delete_admin" on public.lw_product_images
  for delete to authenticated using ((select public.lw_is_admin()));

create policy "site_settings_select_all" on public.lw_site_settings
  for select to anon, authenticated using (true);
create policy "site_settings_update_admin" on public.lw_site_settings
  for update to authenticated
  using ((select public.lw_is_admin())) with check ((select public.lw_is_admin()));

-- ---------------------------------------------------------------------
-- Orders: no direct inserts (place_order RPC only). Owners read, admin reads/updates.
-- Status changes go through update_order_status / cancel_order.
-- ---------------------------------------------------------------------
create policy "orders_select_own_or_admin" on public.lw_orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.lw_is_admin()));

create policy "order_items_select_own_or_admin" on public.lw_order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.lw_orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
    or (select public.lw_is_admin())
  );

create policy "order_status_history_select_own_or_admin" on public.lw_order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.lw_orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
    or (select public.lw_is_admin())
  );

revoke insert, update, delete on public.lw_orders from anon, authenticated;
revoke insert, update, delete on public.lw_order_items from anon, authenticated;
revoke insert, update, delete on public.lw_order_status_history from anon, authenticated;
revoke all on public.lw_checkout_attempts from anon, authenticated;

-- ---------------------------------------------------------------------
-- Customer-owned data
-- ---------------------------------------------------------------------
create policy "wishlists_select_own" on public.lw_wishlists
  for select to authenticated using (user_id = (select auth.uid()));
create policy "wishlists_insert_own" on public.lw_wishlists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "wishlists_delete_own" on public.lw_wishlists
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "addresses_select_own" on public.lw_addresses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "addresses_insert_own" on public.lw_addresses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "addresses_update_own" on public.lw_addresses
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "addresses_delete_own" on public.lw_addresses
  for delete to authenticated using (user_id = (select auth.uid()));

-- Anonymous users never touch customer-owned tables.
revoke all on public.lw_wishlists from anon;
revoke all on public.lw_addresses from anon;
revoke all on public.lw_profiles from anon;
revoke all on public.lw_orders from anon;
revoke all on public.lw_order_items from anon;
revoke all on public.lw_order_status_history from anon;
