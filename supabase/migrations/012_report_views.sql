-- Bloom: which monthly reports each bro has opened, for the unread badge (Monthly Summary, phase S3)

create table report_views (
  bro_id uuid not null references bros (id) on delete cascade,
  month date not null, -- first day of the month
  viewed_at timestamptz not null default now(),
  primary key (bro_id, month)
);

-- Each bro sees and adds only their own; repeat views are ignored (on conflict do nothing)
alter table report_views enable row level security;

create policy "read your own" on report_views
  for select to authenticated using (bro_id = (select current_bro_id()));
create policy "add as yourself" on report_views
  for insert to authenticated with check (bro_id = (select current_bro_id()));
