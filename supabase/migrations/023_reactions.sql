-- Bloom: reactions on the message board (Messenger, phase M3)

create table message_reactions (
  message_id uuid not null references messages (id) on delete cascade,
  bro_id uuid not null references bros (id) on delete cascade,
  emoji text not null check (emoji in ('☕', '👍', '❤️', '😂', '🔥', '😮')),
  created_at timestamptz not null default now(),
  primary key (message_id, bro_id, emoji)
);

alter table message_reactions enable row level security;

create policy "bros can read" on message_reactions
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "react as yourself" on message_reactions
  for insert to authenticated with check (bro_id = (select current_bro_id()));
create policy "unreact your own" on message_reactions
  for delete to authenticated using (bro_id = (select current_bro_id()));

alter publication supabase_realtime add table message_reactions;
