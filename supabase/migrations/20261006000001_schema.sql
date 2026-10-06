-- =====================================================================
-- Luxe Watch — core schema: tables, constraints, indexes, triggers
-- =====================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

-- Immutable unaccent wrapper so it can be used in generated columns / indexes.
-- Lets customers search "dong ho" and match "đồng hồ".
create or replace function public.lw_immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

create or replace function public.lw_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.lw_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (phone ~ '^(0|\+84)(3|5|7|8|9)[0-9]{8}$'),
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- catalog
-- ---------------------------------------------------------------------
create table public.lw_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_vi text not null check (char_length(name_vi) between 1 and 120),
  name_en text not null check (char_length(name_en) between 1 and 120),
  parent_id uuid references public.lw_categories (id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lw_brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  logo_url text check (char_length(logo_url) <= 500),
  description_vi text check (char_length(description_vi) <= 5000),
  description_en text check (char_length(description_en) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lw_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null unique check (char_length(sku) between 1 and 64),
  name_vi text not null check (char_length(name_vi) between 1 and 200),
  name_en text not null check (char_length(name_en) between 1 and 200),
  description_vi text check (char_length(description_vi) <= 10000),
  description_en text check (char_length(description_en) <= 10000),
  price bigint not null check (price >= 0),
  compare_at_price bigint check (compare_at_price is null or compare_at_price > price),
  stock int not null default 0 check (stock >= 0),
  category_id uuid references public.lw_categories (id) on delete set null,
  brand_id uuid references public.lw_brands (id) on delete set null,
  features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  seo_title_vi text check (char_length(seo_title_vi) <= 120),
  seo_title_en text check (char_length(seo_title_en) <= 120),
  seo_description_vi text check (char_length(seo_description_vi) <= 320),
  seo_description_en text check (char_length(seo_description_en) <= 320),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', public.lw_immutable_unaccent(coalesce(name_vi, ''))), 'A') ||
    setweight(to_tsvector('simple', public.lw_immutable_unaccent(coalesce(name_en, ''))), 'A') ||
    setweight(to_tsvector('simple', coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('simple', public.lw_immutable_unaccent(coalesce(description_vi, ''))), 'C') ||
    setweight(to_tsvector('simple', public.lw_immutable_unaccent(coalesce(description_en, ''))), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lw_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.lw_products (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  alt_vi text check (char_length(alt_vi) <= 200),
  alt_en text check (char_length(alt_en) <= 200),
  sort_order int not null default 0,
  width int not null check (width > 0),
  height int not null check (height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table public.lw_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_phone text not null check (customer_phone ~ '^0(3|5|7|8|9)[0-9]{8}$'),
  customer_email text check (char_length(customer_email) <= 254),
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  subtotal bigint not null check (subtotal >= 0),
  shipping_fee bigint not null check (shipping_fee >= 0),
  total bigint not null check (total >= 0),
  payment_method text not null default 'cod' check (payment_method = 'cod'),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
  locale text not null default 'vi' check (locale in ('vi', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lw_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.lw_orders (id) on delete cascade,
  product_id uuid references public.lw_products (id) on delete set null,
  product_name text not null,
  sku text not null,
  image_path text,
  unit_price bigint not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lw_order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.lw_orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Checkout rate-limit log (written only by place_order; no client access).
create table public.lw_checkout_attempts (
  id bigint generated always as identity primary key,
  ip_hash text,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- customer data
-- ---------------------------------------------------------------------
create table public.lw_wishlists (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.lw_products (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.lw_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipient_name text not null check (char_length(recipient_name) between 1 and 120),
  phone text not null check (phone ~ '^(0|\+84)(3|5|7|8|9)[0-9]{8}$'),
  province text not null check (char_length(province) between 1 and 120),
  ward text not null check (char_length(ward) between 1 and 120),
  street text not null check (char_length(street) between 1 and 255),
  note text check (char_length(note) <= 500),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- settings (singleton)
-- ---------------------------------------------------------------------
create table public.lw_site_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Luxe Watch' check (char_length(store_name) between 1 and 120),
  hero_image_path text,
  hero_title_vi text check (char_length(hero_title_vi) <= 200),
  hero_title_en text check (char_length(hero_title_en) <= 200),
  hero_subtitle_vi text check (char_length(hero_subtitle_vi) <= 500),
  hero_subtitle_en text check (char_length(hero_subtitle_en) <= 500),
  contact_email text check (char_length(contact_email) <= 254),
  contact_phone text check (char_length(contact_phone) <= 20),
  address text check (char_length(address) <= 500),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  shipping_fee bigint not null default 30000 check (shipping_fee >= 0),
  free_shipping_threshold bigint not null default 5000000 check (free_shipping_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index lw_categories_parent_id_idx on public.lw_categories (parent_id);
create index lw_products_active_featured_idx on public.lw_products (is_active, is_featured);
create index lw_products_category_id_idx on public.lw_products (category_id);
create index lw_products_brand_id_idx on public.lw_products (brand_id);
create index lw_products_price_idx on public.lw_products (price);
create index lw_products_created_at_idx on public.lw_products (created_at desc);
create index lw_products_search_idx on public.lw_products using gin (search_vector);
create index lw_products_features_idx on public.lw_products using gin (features);
create index lw_product_images_product_id_idx on public.lw_product_images (product_id, sort_order);
create index lw_orders_status_created_idx on public.lw_orders (status, created_at desc);
create index lw_orders_created_at_idx on public.lw_orders (created_at desc);
create index lw_orders_user_id_idx on public.lw_orders (user_id);
create index lw_orders_customer_phone_idx on public.lw_orders (customer_phone);
create index lw_order_items_order_id_idx on public.lw_order_items (order_id);
create index lw_order_items_product_id_idx on public.lw_order_items (product_id);
create index lw_order_status_history_order_id_idx on public.lw_order_status_history (order_id, created_at);
create index lw_order_status_history_changed_by_idx on public.lw_order_status_history (changed_by);
create index lw_checkout_attempts_created_at_idx on public.lw_checkout_attempts (created_at);
create index lw_checkout_attempts_phone_idx on public.lw_checkout_attempts (phone, created_at);
create index lw_checkout_attempts_ip_hash_idx on public.lw_checkout_attempts (ip_hash, created_at);
create index lw_wishlists_product_id_idx on public.lw_wishlists (product_id);
create index lw_addresses_user_id_idx on public.lw_addresses (user_id);
create unique index lw_addresses_one_default_per_user_idx
  on public.lw_addresses (user_id) where is_default;

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'lw_profiles', 'lw_categories', 'lw_brands', 'lw_products', 'lw_product_images', 'lw_orders',
    'lw_order_items', 'lw_order_status_history', 'lw_checkout_attempts', 'lw_wishlists',
    'lw_addresses', 'lw_site_settings'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.lw_set_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Auto-create profile on sign-up (auth.users is shared with other apps in this
-- project, so this must never fail).
-- ---------------------------------------------------------------------
create or replace function public.lw_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lw_profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger lw_on_auth_user_created
  after insert on auth.users
  for each row execute function public.lw_handle_new_user();

revoke execute on function public.lw_handle_new_user() from public, anon, authenticated;
revoke execute on function public.lw_set_updated_at() from public, anon, authenticated;
