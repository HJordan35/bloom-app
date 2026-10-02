-- Bloom: initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto with schema extensions;

-- ── Tables ────────────────────────────────────────────────────────────────

create table bros (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table roasters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  created_by uuid not null references bros (id),
  created_at timestamptz not null default now()
);

create table roasts (
  id uuid primary key default gen_random_uuid(),
  roaster_id uuid not null references roasters (id) on delete cascade,
  name text not null,
  roast_level text not null check (roast_level in ('light', 'medium', 'dark')),
  region text,
  created_by uuid not null references bros (id),
  created_at timestamptz not null default now(),
  unique (roaster_id, name)
);

create table brews (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id),
  roast_id uuid not null references roasts (id) on delete cascade,
  method text not null,
  dose_g numeric,
  grind_size text,
  grinder text,
  temp_c numeric,
  brew_time_s integer,
  volume_ml numeric,
  result text,
  dialed_in boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table endorsements (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id),
  roast_id uuid not null references roasts (id) on delete cascade,
  method text,
  rating integer check (rating between 1 and 10), -- null = note only
  note text,
  created_at timestamptz not null default now()
);

create index on brews (bro_id, started_at desc);
create index on brews (roast_id);
create index on endorsements (roast_id);

-- MVP: no RLS (auth hardening is a later phase)
alter table bros disable row level security;
alter table roasters disable row level security;
alter table roasts disable row level security;
alter table brews disable row level security;
alter table endorsements disable row level security;

-- Live "brewing now" updates
alter publication supabase_realtime add table brews;

-- ── Auth ──────────────────────────────────────────────────────────────────

create function login(p_email text, p_password text)
returns table (id uuid, first_name text, last_name text, email text)
language sql
security definer
set search_path = public, extensions
as $$
  select b.id, b.first_name, b.last_name, b.email
  from bros b
  where lower(b.email) = lower(p_email)
    and b.password_hash = crypt(p_password, b.password_hash);
$$;

-- ── Views ─────────────────────────────────────────────────────────────────

-- Open brews started within the last 2 hours count as "brewing now"
create view active_brews as
select *
from brews
where finished_at is null
  and started_at > now() - interval '2 hours';

-- Each bro's latest rating per roast + method (so repeat endorsements don't stack)
create view latest_ratings as
select distinct on (bro_id, roast_id, method) bro_id, roast_id, method, rating
from endorsements
where rating is not null
order by bro_id, roast_id, method, created_at desc;

-- Ranking: score = 0.5 * avg rating (5 if none) + 0.5 * min(10, 3 * ln(1 + brews))
create view roast_rankings as
with e as (
  select roast_id, avg(rating) as avg_rating, count(*) as rating_count
  from latest_ratings
  group by roast_id
),
b as (
  select roast_id, count(*) as brew_count
  from brews
  group by roast_id
)
select
  r.id as roast_id,
  r.roaster_id,
  coalesce(b.brew_count, 0) as brew_count,
  round(e.avg_rating, 1) as avg_rating,
  coalesce(e.rating_count, 0) as rating_count,
  round(
    0.5 * coalesce(e.avg_rating, 5)
    + 0.5 * least(10, 3 * ln(1 + coalesce(b.brew_count, 0)))::numeric,
    1
  ) as score
from roasts r
left join e on e.roast_id = r.id
left join b on b.roast_id = r.id;

create view roaster_rankings as
with e as (
  select r.roaster_id, avg(l.rating) as avg_rating, count(*) as rating_count
  from latest_ratings l
  join roasts r on r.id = l.roast_id
  group by r.roaster_id
),
b as (
  select r.roaster_id, count(*) as brew_count
  from brews br
  join roasts r on r.id = br.roast_id
  group by r.roaster_id
)
select
  ro.id as roaster_id,
  coalesce(b.brew_count, 0) as brew_count,
  round(e.avg_rating, 1) as avg_rating,
  coalesce(e.rating_count, 0) as rating_count,
  round(
    0.5 * coalesce(e.avg_rating, 5)
    + 0.5 * least(10, 3 * ln(1 + coalesce(b.brew_count, 0)))::numeric,
    1
  ) as score
from roasters ro
left join e on e.roaster_id = ro.id
left join b on b.roaster_id = ro.id;

-- Bros Board feed
create view events as
select
  'brew' as type, br.id as ref_id, br.bro_id, br.roast_id, r.roaster_id,
  br.method, null::integer as rating, br.result as note, br.started_at as created_at
from brews br
join roasts r on r.id = br.roast_id
union all
select
  'roaster', ro.id, ro.created_by, null, ro.id,
  null, null, null, ro.created_at
from roasters ro
union all
select
  'roast', r.id, r.created_by, r.id, r.roaster_id,
  null, null, null, r.created_at
from roasts r
union all
select
  'endorsement', en.id, en.bro_id, en.roast_id, r.roaster_id,
  en.method, en.rating, en.note, en.created_at
from endorsements en
join roasts r on r.id = en.roast_id;
