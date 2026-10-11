-- Bloom: agent-written monthly insights (Monthly Summary, phase S1)
-- Only the insights Edge Function (service role) writes these tables.

-- One agent run for one bro and month. Every run is kept, so prompt versions can be
-- compared; a bro's current insights for a month are the latest succeeded run's.
create table insight_runs (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id) on delete cascade,
  month date not null, -- first day of the month
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  model text not null,
  prompt_version text not null,
  usage jsonb, -- tokens, web searches, turns, ms
  trace jsonb, -- the tool calls the agent made, for review
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references insight_runs (id) on delete cascade,
  bro_id uuid not null references bros (id) on delete cascade,
  month date not null,
  position smallint not null check (position between 1 and 3),
  type text not null check (type in ('did_you_know', 'pattern', 'recommendation', 'fact', 'jab')),
  content text not null,
  sources jsonb not null default '[]', -- [{ title, url }] for web-backed claims
  created_at timestamptz not null default now(),
  unique (run_id, position)
);

create index on insight_runs (bro_id, month, started_at desc);
create index on insights (month, bro_id);

-- Every bro can read every bro's insights; no write policies, so only the service role writes
alter table insight_runs enable row level security;
alter table insights enable row level security;

create policy "bros can read" on insight_runs
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "bros can read" on insights
  for select to authenticated using ((select current_bro_id()) is not null);
