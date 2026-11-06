-- Bloom: preferred recipes, a bro's go-to recipe for a roast + method (Preferred Recipes, phase R1)
-- Their own table, not brews: a recipe saved from scratch must never count as a brew.

create table preferred_recipes (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id),
  roast_id uuid not null references roasts (id) on delete cascade,
  method text not null,
  label text, -- "Comandante", "Iced": tells several for one method apart
  -- Same recipe columns as brews
  dose_g numeric,
  grind_size text,
  grinder text,
  temp numeric,
  temp_unit text not null default 'F' check (temp_unit in ('C', 'F')),
  -- Estimates: shown as a target while brewing, never written to the brew
  brew_time_s integer,
  volume_ml numeric,
  brew_notes text,
  -- A copy, not a link: editing or deleting the brew leaves the recipe as saved
  source_brew_id uuid references brews (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No unique (bro, roast, method): several are allowed, and "replace or keep both" is the UI's call
create index on preferred_recipes (roast_id, method);
create index on preferred_recipes (bro_id);

alter table preferred_recipes enable row level security;

create policy "bros can read" on preferred_recipes
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "add as yourself" on preferred_recipes
  for insert to authenticated with check (bro_id = (select current_bro_id()));
create policy "edit your own" on preferred_recipes
  for update to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));
create policy "delete your own" on preferred_recipes
  for delete to authenticated using (bro_id = (select current_bro_id()));

alter publication supabase_realtime add table preferred_recipes;

-- The preferred recipe a brew was started from, for its target time and volume
alter table brews
  add column preferred_recipe_id uuid references preferred_recipes (id) on delete set null;
