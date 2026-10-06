-- =====================================================================
-- Generic sliding-window rate limiter (guest order lookup, etc.).
-- Service-role only; buckets are hashed keys like "track:<sha256(ip)>".
-- =====================================================================

create table public.lw_rate_events (
  id bigint generated always as identity primary key,
  bucket text not null check (char_length(bucket) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lw_rate_events_bucket_created_idx on public.lw_rate_events (bucket, created_at);

create trigger set_updated_at before update on public.lw_rate_events
  for each row execute function public.lw_set_updated_at();

alter table public.lw_rate_events enable row level security;
revoke all on public.lw_rate_events from anon, authenticated;

-- Returns true when the call is allowed (and records it), false when limited.
create or replace function public.lw_hit_rate_limit(p_bucket text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  delete from public.lw_rate_events where created_at < now() - interval '1 day';

  select count(*) into v_count
  from public.lw_rate_events
  where bucket = p_bucket
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into public.lw_rate_events (bucket) values (p_bucket);
  return true;
end;
$$;

revoke execute on function public.lw_hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.lw_hit_rate_limit(text, int, int) to service_role;
