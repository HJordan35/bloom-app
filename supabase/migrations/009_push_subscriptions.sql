-- Bloom: devices subscribed to push notifications (Push, phase P1)
-- One row per device. The notify Edge Function (service role) reads them all.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- Bros manage their own devices only.
create policy "own subscriptions" on push_subscriptions
  for all to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));

revoke all on push_subscriptions from anon;
