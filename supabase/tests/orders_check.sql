-- Self-check for checkout/order functions + RLS. Runs in a transaction and rolls back.
-- Run (local stack):
--   docker exec -i supabase_db_luxe-watch psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/orders_check.sql
begin;

do $$
declare
  v_pid uuid;
  v_stock int;
  v_price bigint;
  v_code text;
  v_order record;
  v_admin uuid := gen_random_uuid();
  v_failed boolean;
  i int;
begin
  select id, stock, price into v_pid, v_stock, v_price
  from public.lw_products where slug = 'seiko-5-sports-field';

  -- 1. Happy path: client price is ignored, stock decremented, free shipping applied.
  v_code := public.lw_place_order(jsonb_build_object(
    'customer_name', 'Nguyễn Văn A',
    'customer_phone', '+84901234567',
    'locale', 'vi',
    'ip', '203.0.113.1',
    'shipping_address', jsonb_build_object('province', 'TP. Hồ Chí Minh', 'ward', 'Phường Sài Gòn', 'street', '1 Lê Lợi'),
    'items', jsonb_build_array(
      jsonb_build_object('product_id', v_pid, 'quantity', 1, 'price', 1),
      jsonb_build_object('product_id', v_pid, 'quantity', 1)
    )
  ));
  assert v_code ~ '^LW-[0-9]{6}-[A-Z0-9]{4}$', 'order code format: ' || v_code;

  select * into v_order from public.lw_orders where order_code = v_code;
  assert v_order.customer_phone = '0901234567', 'phone normalized';
  assert v_order.subtotal = v_price * 2, 'subtotal from DB price';
  assert v_order.shipping_fee = 0, 'free shipping above threshold';
  assert v_order.total = v_order.subtotal, 'total';
  assert (select stock from public.lw_products where id = v_pid) = v_stock - 2, 'stock decremented';
  assert (select count(*) from public.lw_order_items where order_id = v_order.id) = 1, 'duplicate lines merged';
  assert (select count(*) from public.lw_order_status_history where order_id = v_order.id) = 1, 'history written';

  -- 2. Guest lookup.
  assert public.lw_get_order_by_code(lower(v_code), '0901234567') ->> 'status' = 'pending', 'lookup by code+phone';
  assert public.lw_get_order_by_code(v_code, '0909999999') is null, 'wrong phone → null';

  -- 3. Out of stock.
  v_failed := false;
  begin
    perform public.lw_place_order(jsonb_build_object(
      'customer_name', 'B', 'customer_phone', '0912345678',
      'shipping_address', jsonb_build_object('province', 'Hà Nội', 'ward', 'Phường Hoàn Kiếm', 'street', '2 Tràng Tiền'),
      'items', jsonb_build_array(jsonb_build_object('product_id', v_pid, 'quantity', 99))
    ));
  exception when others then
    v_failed := sqlerrm = 'OUT_OF_STOCK';
  end;
  assert v_failed, 'OUT_OF_STOCK raised';

  -- 4. Inactive product.
  update public.lw_products set is_active = false where slug = 'tissot-everytime-lady';
  v_failed := false;
  begin
    perform public.lw_place_order(jsonb_build_object(
      'customer_name', 'C', 'customer_phone', '0912345679',
      'shipping_address', jsonb_build_object('province', 'Hà Nội', 'ward', 'Phường Hoàn Kiếm', 'street', '3 Tràng Tiền'),
      'items', jsonb_build_array(jsonb_build_object(
        'product_id', (select id from public.lw_products where slug = 'tissot-everytime-lady'), 'quantity', 1))
    ));
  exception when others then
    v_failed := sqlerrm = 'PRODUCT_UNAVAILABLE';
  end;
  assert v_failed, 'PRODUCT_UNAVAILABLE raised';

  -- 5. Invalid phone.
  v_failed := false;
  begin
    perform public.lw_place_order(jsonb_build_object(
      'customer_name', 'D', 'customer_phone', '0123',
      'shipping_address', jsonb_build_object('province', 'x', 'ward', 'y', 'street', 'z'),
      'items', jsonb_build_array(jsonb_build_object('product_id', v_pid, 'quantity', 1))
    ));
  exception when others then
    v_failed := sqlerrm = 'INVALID_PHONE';
  end;
  assert v_failed, 'INVALID_PHONE raised';

  -- 6. Rate limit: 5 orders / 10 min per phone (1 already placed above).
  for i in 1..4 loop
    perform public.lw_place_order(jsonb_build_object(
      'customer_name', 'A', 'customer_phone', '0901234567',
      'shipping_address', jsonb_build_object('province', 'x', 'ward', 'y', 'street', 'z'),
      'items', jsonb_build_array(jsonb_build_object('product_id', v_pid, 'quantity', 1))
    ));
  end loop;
  v_failed := false;
  begin
    perform public.lw_place_order(jsonb_build_object(
      'customer_name', 'A', 'customer_phone', '0901234567',
      'shipping_address', jsonb_build_object('province', 'x', 'ward', 'y', 'street', 'z'),
      'items', jsonb_build_array(jsonb_build_object('product_id', v_pid, 'quantity', 1))
    ));
  exception when others then
    v_failed := sqlerrm = 'RATE_LIMITED';
  end;
  assert v_failed, 'RATE_LIMITED raised on 6th order';

  -- 7. Admin cancel restores stock; non-admin is forbidden.
  insert into auth.users (id, email) values (v_admin, 'admin-check@example.com');
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  v_failed := false;
  begin
    perform public.lw_cancel_order(v_order.id, 'test');
  exception when others then
    v_failed := sqlerrm = 'FORBIDDEN';
  end;
  assert v_failed, 'non-admin cannot cancel';

  update public.lw_profiles set role = 'admin' where id = v_admin;
  v_stock := (select stock from public.lw_products where id = v_pid);
  perform public.lw_update_order_status(v_order.id, 'confirmed');
  v_failed := false;
  begin
    perform public.lw_update_order_status(v_order.id, 'delivered');
  exception when others then
    v_failed := sqlerrm = 'INVALID_TRANSITION';
  end;
  assert v_failed, 'confirmed → delivered rejected';
  perform public.lw_cancel_order(v_order.id, 'customer request');
  assert (select status from public.lw_orders where id = v_order.id) = 'cancelled', 'cancelled';
  assert (select stock from public.lw_products where id = v_pid) = v_stock + 2, 'stock restored';
  assert (select count(*) from public.lw_order_status_history where order_id = v_order.id) = 3, 'history rows';

  raise notice 'orders_check: function checks passed';
end;
$$;

-- RLS checks as anon (clear the admin JWT claims set above).
select set_config('request.jwt.claims', '', true);
set local role anon;
do $$
begin
  assert (select count(*) from public.lw_products where not is_active) = 0, 'anon sees no inactive products';
  assert (select count(*) from public.lw_products) > 0, 'anon sees active products';
  begin
    perform 1 from public.lw_orders;
    assert false, 'anon must not read orders';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.lw_place_order('{}'::jsonb);
    assert false, 'anon must not call place_order';
  exception when insufficient_privilege then null;
  end;
  raise notice 'orders_check: anon RLS checks passed';
end;
$$;
reset role;

-- Customers cannot escalate their role.
do $$
declare
  v_user uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (v_user, 'customer-check@example.com');
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.lw_profiles set role = 'admin' where id = v_user;
    assert false, 'customer must not update role';
  exception when insufficient_privilege then null;
  end;
  update public.lw_profiles set full_name = 'Khách hàng' where id = v_user;
  reset role;
  assert (select full_name from public.lw_profiles where id = v_user) = 'Khách hàng', 'customer updates own name';
  raise notice 'orders_check: profile privilege checks passed';
end;
$$;

-- Reviews: verified purchase only, upsert back to moderation, hidden from anon until approved.
do $$
declare
  v_user uuid := gen_random_uuid();
  v_pid uuid;
  v_code text;
  v_failed boolean := false;
begin
  reset role;
  insert into auth.users (id, email) values (v_user, 'review-check@example.com');
  select id into v_pid from public.lw_products where slug = 'seiko-5-sports-field';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  begin
    perform public.lw_submit_review(v_pid, 5, 'Chưa mua mà đánh giá');
  exception when others then
    v_failed := sqlerrm = 'NOT_ELIGIBLE';
  end;
  assert v_failed, 'review requires a delivered order';

  v_code := public.lw_place_order(jsonb_build_object(
    'user_id', v_user, 'customer_name', 'R', 'customer_phone', '0933333333',
    'shipping_address', jsonb_build_object('province', 'x', 'ward', 'y', 'street', 'z'),
    'items', jsonb_build_array(jsonb_build_object('product_id', v_pid, 'quantity', 1))
  ));
  update public.lw_orders set status = 'delivered' where order_code = v_code;
  perform public.lw_submit_review(v_pid, 5, 'Rất đẹp, giao nhanh');
  update public.lw_reviews set status = 'approved' where user_id = v_user;
  perform public.lw_submit_review(v_pid, 4, 'Sửa lại: đẹp, dây hơi cứng');
  assert (select count(*) from public.lw_reviews where user_id = v_user) = 1, 'one review per user/product';
  assert (select status from public.lw_reviews where user_id = v_user) = 'pending', 'edits return to moderation';

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  assert (select count(*) from public.lw_reviews where user_id = v_user) = 0, 'pending review hidden from anon';
  reset role;
  raise notice 'orders_check: review checks passed';
end;
$$;

rollback;
