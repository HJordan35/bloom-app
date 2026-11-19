-- Bloom: "new since last check" for the Inbox's Messages and Notifications tabs (Messenger, phase M1)

-- One row per bro: when each tab was last opened. -infinity = never, so stamping one tab
-- never marks the other as seen.
create table inbox_seen (
  bro_id uuid primary key references bros (id) on delete cascade,
  messages_at timestamptz not null default '-infinity',
  notifications_at timestamptz not null default '-infinity'
);

alter table inbox_seen enable row level security;

create policy "read your own" on inbox_seen
  for select to authenticated using (bro_id = (select current_bro_id()));
create policy "add as yourself" on inbox_seen
  for insert to authenticated with check (bro_id = (select current_bro_id()));
create policy "update your own" on inbox_seen
  for update to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));

-- Is there anything from another bro since you last opened each tab? (messages: M2)
create function inbox_unread()
returns table (messages boolean, notifications boolean)
language sql
stable
security invoker
set search_path = public
as $$
  with seen as (
    select coalesce(
      (select notifications_at from inbox_seen where bro_id = current_bro_id()),
      '-infinity'
    ) as notifications_at
  )
  select
    false,
    exists (
      select 1 from events e, seen
      where e.created_at > seen.notifications_at and e.bro_id <> current_bro_id()
    );
$$;

-- Stamp one tab as seen, on the server's clock (a phone's clock can't make old events new again)
create function mark_inbox_seen(tab text)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into inbox_seen (bro_id) values (current_bro_id()) on conflict do nothing;
  update inbox_seen
  set
    messages_at = case when tab = 'messages' then now() else messages_at end,
    notifications_at = case when tab = 'notifications' then now() else notifications_at end
  where bro_id = current_bro_id();
$$;

revoke execute on function inbox_unread() from public, anon;
revoke execute on function mark_inbox_seen(text) from public, anon;
grant execute on function inbox_unread() to authenticated;
grant execute on function mark_inbox_seen(text) to authenticated;
