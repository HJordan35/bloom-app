-- Bloom: a month's standard numbers, overall and per bro (Monthly Summary, phase S2)
-- Months are calendar months in America/Chicago, the same as the insights function.

create function monthly_stats(p_month date)
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
  month_brews as (
    select b.*
    from brews b, bounds
    where b.started_at >= bounds.from_ts and b.started_at < bounds.to_ts
  ),
  brew_stats as (
    select
      bro_id,
      count(*) as brews,
      coalesce(sum(volume_ml), 0) as volume_ml,
      coalesce(sum(dose_g), 0) as beans_g,
      count(*) filter (where dialed_in) as dialed_in,
      count(distinct roast_id) as roasts_tried
    from month_brews
    group by bro_id
  ),
  -- Roasts this bro brewed this month and never before
  first_tries as (
    select mb.bro_id, count(distinct mb.roast_id) as first_tries
    from month_brews mb, bounds
    where not exists (
      select 1 from brews p
      where p.bro_id = mb.bro_id and p.roast_id = mb.roast_id and p.started_at < bounds.from_ts
    )
    group by mb.bro_id
  ),
  roaster_stats as (
    select created_by as bro_id, count(*) as roasters
    from roasters, bounds
    where created_at >= bounds.from_ts and created_at < bounds.to_ts
    group by created_by
  ),
  roast_stats as (
    select created_by as bro_id, count(*) as roasts
    from roasts, bounds
    where created_at >= bounds.from_ts and created_at < bounds.to_ts
    group by created_by
  ),
  endorsement_stats as (
    select bro_id, count(*) as endorsements
    from endorsements, bounds
    where created_at >= bounds.from_ts and created_at < bounds.to_ts
    group by bro_id
  ),
  -- Every bro, including those who sat the month out
  per_bro as (
    select
      b.id as bro_id,
      b.first_name,
      coalesce(bs.brews, 0) as brews,
      coalesce(bs.volume_ml, 0) as volume_ml,
      coalesce(bs.beans_g, 0) as beans_g,
      coalesce(bs.dialed_in, 0) as dialed_in,
      coalesce(rs.roasters, 0) as roasters,
      coalesce(ro.roasts, 0) as roasts,
      coalesce(es.endorsements, 0) as endorsements,
      coalesce(bs.roasts_tried, 0) as roasts_tried,
      coalesce(ft.first_tries, 0) as first_tries
    from bros b
    left join brew_stats bs on bs.bro_id = b.id
    left join first_tries ft on ft.bro_id = b.id
    left join roaster_stats rs on rs.bro_id = b.id
    left join roast_stats ro on ro.bro_id = b.id
    left join endorsement_stats es on es.bro_id = b.id
  ),
  method_bro as (
    select method, bro_id, count(*) as brews
    from month_brews
    group by method, bro_id
  ),
  methods as (
    select
      method,
      sum(brews) as total,
      jsonb_agg(jsonb_build_object('bro_id', bro_id, 'brews', brews) order by brews desc) as by_bro
    from method_bro
    group by method
  )
  select jsonb_build_object(
    'month', p_month,
    'totals', (
      select jsonb_build_object(
        'brews', sum(brews),
        'volume_ml', sum(volume_ml),
        'beans_g', sum(beans_g),
        'dialed_in', sum(dialed_in),
        'roasters', sum(roasters),
        'roasts', sum(roasts),
        'endorsements', sum(endorsements),
        -- A roast two bros brewed counts once in the group's totals
        'roasts_tried', (select count(distinct roast_id) from month_brews),
        'first_tries', (
          select count(distinct mb.roast_id)
          from month_brews mb, bounds
          where not exists (
            select 1 from brews p
            where p.roast_id = mb.roast_id and p.started_at < bounds.from_ts
          )
        )
      )
      from per_bro
    ),
    'bros', (
      select coalesce(jsonb_agg(to_jsonb(per_bro) order by brews desc, first_name), '[]')
      from per_bro
    ),
    'methods', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('method', method, 'brews', total, 'by_bro', by_bro)
          order by total desc, method
        ),
        '[]'
      )
      from methods
    )
  );
$$;

-- Signed-in bros (and the service role) only
revoke execute on function monthly_stats(date) from public, anon;
grant execute on function monthly_stats(date) to authenticated, service_role;
