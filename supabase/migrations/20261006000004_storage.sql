-- =====================================================================
-- Storage buckets: public read via public URLs; writes admin-only.
-- No broad SELECT policy → anonymous clients cannot list bucket contents.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lw-products', 'lw-products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('lw-site', 'lw-site', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "lw_storage_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id in ('lw-products', 'lw-site') and (select public.lw_is_admin()));

create policy "lw_storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('lw-products', 'lw-site') and (select public.lw_is_admin()));

create policy "lw_storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('lw-products', 'lw-site') and (select public.lw_is_admin()))
  with check (bucket_id in ('lw-products', 'lw-site') and (select public.lw_is_admin()));

create policy "lw_storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('lw-products', 'lw-site') and (select public.lw_is_admin()));
