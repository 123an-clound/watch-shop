-- =====================================================================
-- Admin reporting: customers list and dashboard stats (admin-only).
-- =====================================================================

-- Customers with order count and delivered revenue. Email comes from auth.users,
-- which clients cannot read directly — hence SECURITY DEFINER + explicit admin check.
create or replace function public.lw_admin_customers(p_search text default null, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  role text,
  created_at timestamptz,
  order_count bigint,
  total_spent bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.lw_is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  return query
  with base as (
    select p.id, p.full_name, p.phone, u.email::text as email, p.role, p.created_at
    from public.lw_profiles p
    join auth.users u on u.id = p.id
    where p_search is null or p_search = ''
       or p.full_name ilike '%' || p_search || '%'
       or p.phone ilike '%' || p_search || '%'
       or u.email ilike '%' || p_search || '%'
  )
  select
    b.id, b.full_name, b.phone, b.email, b.role, b.created_at,
    count(o.id) as order_count,
    coalesce(sum(o.total) filter (where o.status = 'delivered'), 0)::bigint as total_spent,
    count(*) over () as total_count
  from base b
  left join public.lw_orders o on o.user_id = b.id
  group by b.id, b.full_name, b.phone, b.email, b.role, b.created_at
  order by b.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
end;
$$;

-- Dashboard aggregates in one round trip. Revenue = delivered orders; days in Asia/Ho_Chi_Minh.
create or replace function public.lw_admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_result jsonb;
begin
  if not public.lw_is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  with local_orders as (
    select o.*, (o.created_at at time zone 'Asia/Ho_Chi_Minh')::date as day
    from public.lw_orders o
  )
  select jsonb_build_object(
    'revenue', jsonb_build_object(
      'today', coalesce(sum(total) filter (where status = 'delivered' and day = v_today), 0),
      'd7', coalesce(sum(total) filter (where status = 'delivered' and day > v_today - 7), 0),
      'd30', coalesce(sum(total) filter (where status = 'delivered' and day > v_today - 30), 0),
      'all', coalesce(sum(total) filter (where status = 'delivered'), 0)
    ),
    'orders', jsonb_build_object(
      'today', count(*) filter (where day = v_today),
      'd7', count(*) filter (where day > v_today - 7),
      'd30', count(*) filter (where day > v_today - 30)
    ),
    'byStatus', (
      select coalesce(jsonb_object_agg(s.status, s.n), '{}'::jsonb)
      from (select status, count(*) as n from public.lw_orders group by status) s
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object('day', d::date, 'revenue', coalesce(x.revenue, 0), 'orders', coalesce(x.orders, 0)) order by d)
      from generate_series(v_today - 29, v_today, interval '1 day') d
      left join (
        select day, sum(total) filter (where status = 'delivered') as revenue, count(*) as orders
        from local_orders group by day
      ) x on x.day = d::date
    ),
    'lowStock', (
      select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name_vi, 'sku', p.sku, 'stock', p.stock) order by p.stock, p.name_vi), '[]'::jsonb)
      from (select * from public.lw_products where is_active and stock <= 3 order by stock, name_vi limit 10) p
    ),
    'latest', (
      select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'code', l.order_code, 'name', l.customer_name, 'total', l.total, 'status', l.status, 'created_at', l.created_at) order by l.created_at desc), '[]'::jsonb)
      from (select * from public.lw_orders order by created_at desc limit 6) l
    )
  )
  into v_result
  from local_orders;

  return v_result;
end;
$$;

revoke execute on function public.lw_admin_customers(text, int, int) from public, anon;
revoke execute on function public.lw_admin_dashboard() from public, anon;
grant execute on function public.lw_admin_customers(text, int, int) to authenticated;
grant execute on function public.lw_admin_dashboard() to authenticated;
