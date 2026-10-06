-- =====================================================================
-- Admin: atomic product save (product row + ordered image set).
-- SECURITY INVOKER → RLS admin policies apply to every statement.
-- Returns { id, removed: [storage paths no longer referenced] } so the
-- caller can delete orphaned files from Storage.
-- =====================================================================

alter table public.lw_product_images
  add constraint lw_product_images_product_path_key unique (product_id, storage_path);

create or replace function public.lw_admin_save_product(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(payload ->> 'id', '')::uuid;
  v_p jsonb := payload -> 'product';
  v_images jsonb := coalesce(payload -> 'images', '[]'::jsonb);
  v_removed text[];
begin
  if not public.lw_is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if jsonb_typeof(v_images) <> 'array' or jsonb_array_length(v_images) > 20 then
    raise exception 'INVALID_IMAGES';
  end if;

  if v_id is null then
    insert into public.lw_products (
      slug, sku, name_vi, name_en, description_vi, description_en, price, compare_at_price,
      stock, category_id, brand_id, features, is_featured, is_active,
      seo_title_vi, seo_title_en, seo_description_vi, seo_description_en
    ) values (
      v_p ->> 'slug', v_p ->> 'sku', v_p ->> 'name_vi', v_p ->> 'name_en',
      nullif(v_p ->> 'description_vi', ''), nullif(v_p ->> 'description_en', ''),
      (v_p ->> 'price')::bigint, nullif(v_p ->> 'compare_at_price', '')::bigint,
      (v_p ->> 'stock')::int, nullif(v_p ->> 'category_id', '')::uuid, nullif(v_p ->> 'brand_id', '')::uuid,
      coalesce(v_p -> 'features', '{}'::jsonb), (v_p ->> 'is_featured')::boolean, (v_p ->> 'is_active')::boolean,
      nullif(v_p ->> 'seo_title_vi', ''), nullif(v_p ->> 'seo_title_en', ''),
      nullif(v_p ->> 'seo_description_vi', ''), nullif(v_p ->> 'seo_description_en', '')
    )
    returning id into v_id;
  else
    update public.lw_products set
      slug = v_p ->> 'slug',
      sku = v_p ->> 'sku',
      name_vi = v_p ->> 'name_vi',
      name_en = v_p ->> 'name_en',
      description_vi = nullif(v_p ->> 'description_vi', ''),
      description_en = nullif(v_p ->> 'description_en', ''),
      price = (v_p ->> 'price')::bigint,
      compare_at_price = nullif(v_p ->> 'compare_at_price', '')::bigint,
      stock = (v_p ->> 'stock')::int,
      category_id = nullif(v_p ->> 'category_id', '')::uuid,
      brand_id = nullif(v_p ->> 'brand_id', '')::uuid,
      features = coalesce(v_p -> 'features', '{}'::jsonb),
      is_featured = (v_p ->> 'is_featured')::boolean,
      is_active = (v_p ->> 'is_active')::boolean,
      seo_title_vi = nullif(v_p ->> 'seo_title_vi', ''),
      seo_title_en = nullif(v_p ->> 'seo_title_en', ''),
      seo_description_vi = nullif(v_p ->> 'seo_description_vi', ''),
      seo_description_en = nullif(v_p ->> 'seo_description_en', '')
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
  end if;

  select coalesce(array_agg(pi.storage_path), '{}') into v_removed
  from public.lw_product_images pi
  where pi.product_id = v_id
    and pi.storage_path not in (select e ->> 'storage_path' from jsonb_array_elements(v_images) e);

  delete from public.lw_product_images
  where product_id = v_id and storage_path = any (v_removed);

  insert into public.lw_product_images (product_id, storage_path, alt_vi, alt_en, sort_order, width, height)
  select
    v_id,
    e ->> 'storage_path',
    nullif(left(e ->> 'alt_vi', 200), ''),
    nullif(left(e ->> 'alt_en', 200), ''),
    (t.ord - 1)::int,
    (e ->> 'width')::int,
    (e ->> 'height')::int
  from jsonb_array_elements(v_images) with ordinality as t(e, ord)
  on conflict (product_id, storage_path) do update set
    alt_vi = excluded.alt_vi,
    alt_en = excluded.alt_en,
    sort_order = excluded.sort_order,
    width = excluded.width,
    height = excluded.height;

  return jsonb_build_object('id', v_id, 'removed', to_jsonb(v_removed));
end;
$$;

revoke execute on function public.lw_admin_save_product(jsonb) from public, anon;
grant execute on function public.lw_admin_save_product(jsonb) to authenticated;
