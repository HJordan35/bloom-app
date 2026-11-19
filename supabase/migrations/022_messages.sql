-- Bloom: the shared message board (Messenger, phase M2)
-- One thread for every bro. Bloom's own posts (release notes, insights) share it with kind = 'bloom'.

create table messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'bro' check (kind in ('bro', 'bloom')),
  bro_id uuid references bros (id) on delete cascade, -- null for Bloom posts
  label text, -- a Bloom post's eyebrow: 'What''s new', 'Insight' (M5)
  body text not null default '',
  -- Parsed from the body on send and edit; who gets a push (M3)
  mentions uuid[] not null default '{}',
  mention_all boolean not null default false,
  -- Shared items and photos (M4)
  recipe_id uuid references preferred_recipes (id) on delete set null,
  brew_id uuid references brews (id) on delete set null,
  photo_path text,
  photo_w integer,
  photo_h integer,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index on messages (created_at desc);

alter table messages enable row level security;

create policy "bros can read" on messages
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "post as yourself" on messages
  for insert to authenticated
  with check (kind = 'bro' and bro_id = (select current_bro_id()));
create policy "edit your own" on messages
  for update to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));
create policy "delete your own" on messages
  for delete to authenticated using (bro_id = (select current_bro_id()));

-- An edit changes the text and what it mentions, nothing else
revoke update on messages from authenticated;
grant update (body, mentions, mention_all, edited_at) on messages to authenticated;

alter publication supabase_realtime add table messages;

-- The dots, now with messages: anything newer than your last look that isn't yours (Bloom's included)
create or replace function inbox_unread()
returns table (messages boolean, notifications boolean)
language sql
stable
security invoker
set search_path = public
as $$
  with seen as (
    select
      coalesce(s.messages_at, '-infinity') as messages_at,
      coalesce(s.notifications_at, '-infinity') as notifications_at
    from (select current_bro_id() as bro_id) me
    left join inbox_seen s on s.bro_id = me.bro_id
  )
  select
    exists (
      select 1 from messages m, seen
      where m.created_at > seen.messages_at and m.bro_id is distinct from current_bro_id()
    ),
    exists (
      select 1 from events e, seen
      where e.created_at > seen.notifications_at and e.bro_id <> current_bro_id()
    );
$$;
