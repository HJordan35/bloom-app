-- Bloom: the month's new coffees and their showcase image (Brewsletter, phase B1)
-- Months are calendar months in America/Chicago, the same as monthly_stats.

-- Roasts the group brewed for the first time this month (no brew by anyone before it), most
-- brewed first. The same rule as monthly_stats' group first_tries, so the counts agree.
create function month_new_roasts(p_month date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      p_month::timestamp at time zone 'America/Chicago' as from_ts,
      (p_month + interval '1 month') at time zone 'America/Chicago' as to_ts
  ),
  new_roasts as (
    select
      b.roast_id,
      count(*) as brews,
      coalesce(sum(b.volume_ml), 0) as volume_ml,
      array_agg(distinct b.bro_id) as bro_ids
    from brews b, bounds
    where b.started_at >= bounds.from_ts and b.started_at < bounds.to_ts
      and not exists (
        select 1 from brews p where p.roast_id = b.roast_id and p.started_at < bounds.from_ts
      )
    group by b.roast_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'roast_id', r.id,
        'name', r.name,
        'roaster', ro.name,
        'photo_path', r.photo_path,
        'brews', n.brews,
        'volume_ml', n.volume_ml,
        'bro_ids', n.bro_ids
      )
      order by n.brews desc, r.name
    ),
    '[]'
  )
  from new_roasts n
  join roasts r on r.id = n.roast_id
  join roasters ro on ro.id = r.roaster_id;
$$;

revoke execute on function month_new_roasts(date) from public, anon;
grant execute on function month_new_roasts(date) to authenticated, service_role;

-- One showcase image per run. Every run is kept; a month's image is its latest succeeded run's.
-- Only the showcase Edge Function (service role) writes.
create table showcase_runs (
  id uuid primary key default gen_random_uuid(),
  month date not null, -- first day of the month
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'skipped', 'failed')),
  roast_ids uuid[] not null default '{}', -- the roasts in the image, in the order sent
  image_path text, -- in the roast-photos bucket
  model text not null,
  prompt_version text not null,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index on showcase_runs (month, started_at desc);

alter table showcase_runs enable row level security;

create policy "bros can read" on showcase_runs
  for select to authenticated using ((select current_bro_id()) is not null);
