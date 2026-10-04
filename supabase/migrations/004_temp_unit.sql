-- Bloom: brew temperature in °F or °C
-- Run together with deploying the matching app build (the old build writes temp_c).

alter table brews rename column temp_c to temp;

-- Existing brews were entered in Celsius; new ones default to Fahrenheit
alter table brews add column temp_unit text not null default 'C' check (temp_unit in ('C', 'F'));
alter table brews alter column temp_unit set default 'F';

-- Unused by the app, and its `select *` column list would now be stale
drop view active_brews;
