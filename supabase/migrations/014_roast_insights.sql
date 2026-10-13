-- Bloom: one agent-written insight per new coffee each month (Brewsletter, phase B3)
-- A run writes a single insight, so run and insight share a row. Every run is kept; a coffee's
-- insight for a month is its latest succeeded row. Only the insights Edge Function writes.

create table roast_insights (
  id uuid primary key default gen_random_uuid(),
  roast_id uuid not null references roasts (id) on delete cascade,
  month date not null, -- first day of the month
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  type text check (type in ('did_you_know', 'pattern', 'recommendation', 'fact', 'jab')),
  content text,
  sources jsonb not null default '[]', -- [{ title, url }] for web-backed claims
  model text not null,
  prompt_version text not null,
  usage jsonb, -- tokens, web searches, turns, ms
  trace jsonb, -- the tool calls the agent made, for review
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index on roast_insights (month, roast_id, started_at desc);

alter table roast_insights enable row level security;

create policy "bros can read" on roast_insights
  for select to authenticated using ((select current_bro_id()) is not null);
