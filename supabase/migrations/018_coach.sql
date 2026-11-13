-- Bloom: the brew coach's chats (Brew Coach, phase A1)
-- Only the coach Edge Function (service role) writes these tables.

-- One conversation. The id is the client's chat id; the messages are the chat as the UI shows it.
create table coach_chats (
  id text primary key,
  bro_id uuid not null references bros (id) on delete cascade,
  -- Filled in as they become known: the roast being discussed, the brew it was open on
  roast_id uuid references roasts (id) on delete set null,
  brew_id uuid references brews (id) on delete set null,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One request to the coach. Every turn is kept, so prompt versions can be compared,
-- and the daily cap counts these.
create table coach_turns (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null references coach_chats (id) on delete cascade,
  bro_id uuid not null references bros (id) on delete cascade,
  mode text not null check (mode in ('before', 'during')),
  model text not null,
  prompt_version text not null,
  knowledge_version text not null,
  usage jsonb, -- tokens, steps, ms
  trace jsonb, -- the tool calls the coach made, for review
  error text,
  created_at timestamptz not null default now()
);

create index on coach_chats (bro_id, updated_at desc);
create index on coach_turns (bro_id, created_at desc);
create index on coach_turns (chat_id, created_at);

-- You read your own; no write policies, so only the service role writes
alter table coach_chats enable row level security;
alter table coach_turns enable row level security;

create policy "read your own" on coach_chats
  for select to authenticated using (bro_id = (select current_bro_id()));
create policy "read your own" on coach_turns
  for select to authenticated using (bro_id = (select current_bro_id()));
