-- =====================================================================
-- Order functions: atomic checkout, status transitions, guest lookup
-- =====================================================================

-- ---------------------------------------------------------------------
-- place_order(payload) → order_code
-- Called ONLY from a Server Action via the service-role client, which sets
-- payload.user_id from the verified session and payload.ip from the request.
-- Prices are always recomputed from the DB; client prices are ignored.
--
-- payload: {
--   user_id?, customer_name, customer_phone, customer_email?, locale, ip?,
--   shipping_address: { province, ward, street, note? },
--   items: [{ product_id, quantity }]
-- }
-- Errors (message): INVALID_NAME | INVALID_PHONE | INVALID_EMAIL | INVALID_ADDRESS |
--   INVALID_ITEMS | RATE_LIMITED | PRODUCT_UNAVAILABLE | OUT_OF_STOCK (detail = product_id)
-- ---------------------------------------------------------------------
create or replace function public.place_order(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := nullif(payload ->> 'user_id', '')::uuid;
  v_name text := btrim(coalesce(payload ->> 'customer_name', ''));
  v_phone text := regexp_replace(btrim(coalesce(payload ->> 'customer_phone', '')), '^\+84', '0');
  v_email text := nullif(lower(btrim(coalesce(payload ->> 'customer_email', ''))), '');
  v_addr jsonb := payload -> 'shipping_address';
  v_locale text := coalesce(payload ->> 'locale', 'vi');
  v_ip_hash text;
  v_items jsonb;
  v_bad uuid;
  v_subtotal bigint;
  v_fee bigint;
  v_threshold bigint;
  v_order_id uuid;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_attempts int;
begin
  -- 1. Validate input ---------------------------------------------------
  if char_length(v_name) not between 1 and 120 then
    raise exception 'INVALID_NAME';
  end if;
  if v_phone !~ '^0(3|5|7|8|9)[0-9]{8}$' then
    raise exception 'INVALID_PHONE';
  end if;
  if v_email is not null
     and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'INVALID_EMAIL';
  end if;
  if v_addr is null or jsonb_typeof(v_addr) <> 'object'
     or char_length(btrim(coalesce(v_addr ->> 'province', ''))) not between 1 and 120
     or char_length(btrim(coalesce(v_addr ->> 'ward', ''))) not between 1 and 120
     or char_length(btrim(coalesce(v_addr ->> 'street', ''))) not between 1 and 255
     or char_length(coalesce(v_addr ->> 'note', '')) > 500 then
    raise exception 'INVALID_ADDRESS';
  end if;
  v_addr := jsonb_build_object(
    'province', btrim(v_addr ->> 'province'),
    'ward', btrim(v_addr ->> 'ward'),
    'street', btrim(v_addr ->> 'street'),
    'note', nullif(btrim(coalesce(v_addr ->> 'note', '')), '')
  );
  if v_locale not in ('vi', 'en') then
    v_locale := 'vi';
  end if;
  if jsonb_typeof(payload -> 'items') is distinct from 'array'
     or jsonb_array_length(payload -> 'items') not between 1 and 50 then
    raise exception 'INVALID_ITEMS';
  end if;

  -- Merge duplicate lines.
  select jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', quantity))
  into v_items
  from (
    select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::int) as quantity
    from jsonb_array_elements(payload -> 'items') e
    group by 1
  ) s;

  if exists (
    select 1 from jsonb_to_recordset(v_items) r(product_id uuid, quantity int)
    where r.product_id is null or r.quantity not between 1 and 99
  ) then
    raise exception 'INVALID_ITEMS';
  end if;

  -- 2. Rate limit: max 5 orders / 10 min per phone or IP -------------------
  if nullif(payload ->> 'ip', '') is not null then
    v_ip_hash := encode(extensions.digest(payload ->> 'ip', 'sha256'), 'hex');
  end if;

  delete from public.checkout_attempts where created_at < now() - interval '1 day';

  select count(*) into v_attempts
  from public.checkout_attempts
  where created_at > now() - interval '10 minutes'
    and (phone = v_phone or (v_ip_hash is not null and ip_hash = v_ip_hash));
  if v_attempts >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.checkout_attempts (ip_hash, phone) values (v_ip_hash, v_phone);

  -- 3. Lock product rows (consistent order avoids deadlocks) --------------
  perform 1
  from public.products p
  where p.id in (select r.product_id from jsonb_to_recordset(v_items) r(product_id uuid, quantity int))
  order by p.id
  for update;

  -- 4. Validate availability + stock ------------------------------------
  select r.product_id into v_bad
  from jsonb_to_recordset(v_items) r(product_id uuid, quantity int)
  left join public.products p on p.id = r.product_id
  where p.id is null or not p.is_active
  limit 1;
  if v_bad is not null then
    raise exception using message = 'PRODUCT_UNAVAILABLE', detail = v_bad::text;
  end if;

  select r.product_id into v_bad
  from jsonb_to_recordset(v_items) r(product_id uuid, quantity int)
  join public.products p on p.id = r.product_id
  where p.stock < r.quantity
  limit 1;
  if v_bad is not null then
    raise exception using message = 'OUT_OF_STOCK', detail = v_bad::text;
  end if;

  -- 5. Totals from DB prices --------------------------------------------
  select sum(p.price * r.quantity) into v_subtotal
  from jsonb_to_recordset(v_items) r(product_id uuid, quantity int)
  join public.products p on p.id = r.product_id;

  select s.shipping_fee, s.free_shipping_threshold into v_fee, v_threshold
  from public.site_settings s where s.id = 1;
  v_fee := case when v_subtotal >= coalesce(v_threshold, 0) then 0 else coalesce(v_fee, 0) end;

  -- 6. Human-readable unique code: LW-YYMMDD-XXXX ------------------------
  loop
    v_code := 'LW-' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD') || '-' ||
      (select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1), '')
       from generate_series(1, 4));
    exit when not exists (select 1 from public.orders o where o.order_code = v_code);
  end loop;

  -- 7. Write order, items, stock, history --------------------------------
  insert into public.orders (
    order_code, user_id, customer_name, customer_phone, customer_email,
    shipping_address, subtotal, shipping_fee, total, payment_method, status, locale
  ) values (
    v_code, v_user_id, v_name, v_phone, v_email,
    v_addr, v_subtotal, v_fee, v_subtotal + v_fee, 'cod', 'pending', v_locale
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, sku, image_path, unit_price, quantity)
  select
    v_order_id,
    p.id,
    case when v_locale = 'en' then p.name_en else p.name_vi end,
    p.sku,
    (select pi.storage_path from public.product_images pi
     where pi.product_id = p.id order by pi.sort_order, pi.created_at limit 1),
    p.price,
    r.quantity
  from jsonb_to_recordset(v_items) r(product_id uuid, quantity int)
  join public.products p on p.id = r.product_id;

  update public.products p
  set stock = p.stock - r.quantity
  from jsonb_to_recordset(v_items) r(product_id uuid, quantity int)
  where p.id = r.product_id;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  values (v_order_id, null, 'pending', v_user_id);

  return v_code;
end;
$$;

-- ---------------------------------------------------------------------
-- cancel_order: admin only; restores stock.
-- ---------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select o.status into v_status from public.orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if v_status in ('delivered', 'cancelled') then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.products p
  set stock = p.stock + oi.quantity
  from (
    select product_id, sum(quantity) as quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) oi
  where p.id = oi.product_id;

  update public.orders set status = 'cancelled' where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_status, 'cancelled', (select auth.uid()), left(p_note, 500));
end;
$$;

-- ---------------------------------------------------------------------
-- update_order_status: admin only; validated transitions + history.
-- pending → confirmed → shipping → delivered; any non-final → cancelled.
-- ---------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_to_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if p_to_status = 'cancelled' then
    perform public.cancel_order(p_order_id, p_note);
    return;
  end if;

  select o.status into v_status from public.orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if not (
    (v_status = 'pending' and p_to_status = 'confirmed') or
    (v_status = 'confirmed' and p_to_status = 'shipping') or
    (v_status = 'shipping' and p_to_status = 'delivered')
  ) then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders set status = p_to_status where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
  values (p_order_id, v_status, p_to_status, (select auth.uid()), left(p_note, 500));
end;
$$;

-- ---------------------------------------------------------------------
-- get_order_by_code: guest order tracking (order_code + phone).
-- Service-role only; the Server Action rate-limits callers.
-- ---------------------------------------------------------------------
create or replace function public.get_order_by_code(p_code text, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_code', o.order_code,
    'status', o.status,
    'customer_name', o.customer_name,
    'shipping_address', o.shipping_address,
    'subtotal', o.subtotal,
    'shipping_fee', o.shipping_fee,
    'total', o.total,
    'payment_method', o.payment_method,
    'created_at', o.created_at,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'sku', oi.sku,
        'image_path', oi.image_path,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity
      ) order by oi.created_at), '[]'::jsonb)
      from public.order_items oi where oi.order_id = o.id
    ),
    'history', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'to_status', h.to_status,
        'created_at', h.created_at
      ) order by h.created_at), '[]'::jsonb)
      from public.order_status_history h where h.order_id = o.id
    )
  )
  from public.orders o
  where o.order_code = upper(btrim(p_code))
    and o.customer_phone = regexp_replace(btrim(p_phone), '^\+84', '0')
$$;

-- ---------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------
revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
revoke execute on function public.get_order_by_code(text, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
grant execute on function public.get_order_by_code(text, text) to service_role;

revoke execute on function public.cancel_order(uuid, text) from public, anon;
revoke execute on function public.update_order_status(uuid, text, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

-- Realtime: admin dashboard listens for new orders (RLS limits delivery to admins).
alter publication supabase_realtime add table public.orders;
