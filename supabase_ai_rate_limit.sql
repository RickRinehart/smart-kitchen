-- Rate-limit counters for the /api/ai proxy. Only the server (service_role) can touch these.
create table if not exists public.ai_rate_limits (
  bucket        text primary key,
  window_start  timestamptz not null default now(),
  request_count integer not null default 0
);
alter table public.ai_rate_limits enable row level security;  -- no policies = no browser access

create or replace function public.ai_rate_check(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  insert into public.ai_rate_limits as t (bucket, window_start, request_count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    window_start  = case when t.window_start < now() - make_interval(secs => p_window_seconds) then now() else t.window_start end,
    request_count = case when t.window_start < now() - make_interval(secs => p_window_seconds) then 1 else t.request_count + 1 end
  returning request_count into v_count;

  -- occasional housekeeping so the table stays tiny
  if random() < 0.01 then
    delete from public.ai_rate_limits where window_start < now() - interval '2 days';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.ai_rate_check(text, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_rate_check(text, integer, integer) to service_role;
