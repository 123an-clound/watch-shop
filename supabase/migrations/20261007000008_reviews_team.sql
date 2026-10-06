-- =====================================================================
-- Verified-purchase product reviews (moderated) + team photo settings.
-- =====================================================================

alter table public.lw_site_settings
  add column team_image_path text check (char_length(team_image_path) <= 500),
  add column team_caption_vi text check (char_length(team_caption_vi) <= 300),
  add column team_caption_en text check (char_length(team_caption_en) <= 300);

create table public.lw_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.lw_products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null check (char_length(author_name) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index lw_reviews_product_status_idx on public.lw_reviews (product_id, status, created_at desc);
create index lw_reviews_status_created_idx on public.lw_reviews (status, created_at desc);
create index lw_reviews_user_id_idx on public.lw_reviews (user_id);

create trigger set_updated_at before update on public.lw_reviews
  for each row execute function public.lw_set_updated_at();

alter table public.lw_reviews enable row level security;

-- Everyone sees approved reviews; authors see their own; admins see all.
create policy "reviews_select" on public.lw_reviews
  for select to anon, authenticated
  using (
    status = 'approved'
    or user_id = (select auth.uid())
    or (select public.lw_is_admin())
  );
create policy "reviews_update_admin" on public.lw_reviews
  for update to authenticated
  using ((select public.lw_is_admin())) with check ((select public.lw_is_admin()));
create policy "reviews_delete_admin" on public.lw_reviews
  for delete to authenticated using ((select public.lw_is_admin()));

-- Inserts only through lw_submit_review (verified purchase check).
revoke insert on public.lw_reviews from anon, authenticated;
-- Admins may only change the moderation status (column-level grant; RLS limits rows to admins).
revoke update on public.lw_reviews from anon, authenticated;
grant update (status) on public.lw_reviews to authenticated;

-- Submit or update the caller's review. Only customers with a DELIVERED order that
-- contains the product may review it. Every (re)submission goes back to moderation.
create or replace function public.lw_submit_review(p_product_id uuid, p_rating int, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if p_rating not between 1 and 5 or char_length(btrim(coalesce(p_body, ''))) not between 10 and 2000 then
    raise exception 'INVALID_INPUT';
  end if;
  if not exists (
    select 1
    from public.lw_orders o
    join public.lw_order_items i on i.order_id = o.id
    where o.user_id = v_uid and o.status = 'delivered' and i.product_id = p_product_id
  ) then
    raise exception 'NOT_ELIGIBLE';
  end if;

  select coalesce(nullif(btrim(p.full_name), ''), 'Khách hàng') into v_name
  from public.lw_profiles p where p.id = v_uid;

  insert into public.lw_reviews (product_id, user_id, author_name, rating, body, status)
  values (p_product_id, v_uid, left(coalesce(v_name, 'Khách hàng'), 80), p_rating, btrim(p_body), 'pending')
  on conflict (product_id, user_id) do update set
    rating = excluded.rating,
    body = excluded.body,
    author_name = excluded.author_name,
    status = 'pending'
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.lw_submit_review(uuid, int, text) from public, anon;
grant execute on function public.lw_submit_review(uuid, int, text) to authenticated;
