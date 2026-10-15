-- Bloom: the Brewsletter's publish record, and the cron that starts it each month (Monthly Summary, phase S4)
-- Needs two Vault secrets first (not in git): 'project_url' and 'insights_secret'. See docs/summary/phase-s4.md.
-- Run before creating the monthly_reports webhook, or the backfill below sends pushes.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- One row per published month. Numbers stay live (monthly_stats); this only says "it's out".
create table monthly_reports (
  month date primary key, -- first day of the month
  published_at timestamptz not null default now()
);

alter table monthly_reports enable row level security;

create policy "bros can read" on monthly_reports
  for select to authenticated using ((select current_bro_id()) is not null);

alter publication supabase_realtime add table monthly_reports;

-- Months already in the app before S4 stay listed
insert into monthly_reports (month)
select distinct month from insight_runs where status = 'succeeded';

-- Publishes the month once every part is done: every bro's insights, every new coffee's insight,
-- and the showcase (made or skipped). Called after each run; the insert's conflict means only
-- the last one to finish publishes, and the monthly_reports webhook sends the push.
create function publish_report(p_month date)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if exists (
    select 1 from bros b
    where not exists (
      select 1 from insight_runs r
      where r.bro_id = b.id and r.month = p_month and r.status = 'succeeded'
    )
  ) or exists (
    select 1 from jsonb_array_elements(month_new_roasts(p_month)) n
    where not exists (
      select 1 from roast_insights ri
      where ri.roast_id = (n ->> 'roast_id')::uuid and ri.month = p_month and ri.status = 'succeeded'
    )
  ) or not exists (
    select 1 from showcase_runs s
    where s.month = p_month and s.status in ('succeeded', 'skipped')
  ) then
    return false;
  end if;

  insert into monthly_reports (month) values (p_month) on conflict do nothing;
  return found;
end;
$$;

-- Starts a month's Brewsletter: the insights fan-out and the showcase, both of which reply 202
-- and work in the background. Defaults to last month in Chicago; pass '2026-09' to force one.
create function start_brewsletter(
  p_month text default to_char((now() at time zone 'America/Chicago') - interval '1 month', 'YYYY-MM')
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url');
  v_headers jsonb := jsonb_build_object(
    'content-type', 'application/json',
    'x-insights-secret',
    (select decrypted_secret from vault.decrypted_secrets where name = 'insights_secret')
  );
begin
  perform net.http_post(
    url := v_url || '/functions/v1/insights',
    headers := v_headers,
    body := jsonb_build_object('month', p_month)
  );
  perform net.http_post(
    url := v_url || '/functions/v1/showcase',
    headers := v_headers,
    body := jsonb_build_object('month', p_month)
  );
end;
$$;

-- Server-side only: the Edge Functions (service role) and the cron (postgres)
revoke execute on function publish_report(date) from public, anon, authenticated;
revoke execute on function start_brewsletter(text) from public, anon, authenticated;

-- The 1st at 14:00 UTC: 9am in Chicago in summer, 8am in winter
select cron.schedule('brewsletter', '0 14 1 * *', 'select start_brewsletter()');
