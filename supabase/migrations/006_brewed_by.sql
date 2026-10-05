-- Bloom: who has brewed each roast / roaster (avatars on library tiles)
-- Same views as 001, plus a trailing brewed_by column (bro ids).

create or replace view roast_rankings with (security_invoker = on) as
with e as (
  select roast_id, avg(rating) as avg_rating, count(*) as rating_count
  from latest_ratings
  group by roast_id
),
b as (
  select roast_id, count(*) as brew_count, array_agg(distinct bro_id) as brewed_by
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
  ) as score,
  coalesce(b.brewed_by, '{}') as brewed_by
from roasts r
left join e on e.roast_id = r.id
left join b on b.roast_id = r.id;

create or replace view roaster_rankings with (security_invoker = on) as
with e as (
  select r.roaster_id, avg(l.rating) as avg_rating, count(*) as rating_count
  from latest_ratings l
  join roasts r on r.id = l.roast_id
  group by r.roaster_id
),
b as (
  select r.roaster_id, count(*) as brew_count, array_agg(distinct br.bro_id) as brewed_by
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
  ) as score,
  coalesce(b.brewed_by, '{}') as brewed_by
from roasters ro
left join e on e.roaster_id = ro.id
left join b on b.roaster_id = ro.id;
