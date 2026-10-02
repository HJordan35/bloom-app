-- Bloom: Supabase Auth + row level security
--
-- Before running:
--   1. Authentication → Sign In / Providers: turn OFF "Allow new users to sign up".
--   2. Authentication → Users → Add user for every bro (same email as in `bros`,
--      tick "Auto Confirm User").
-- This migration aborts if any bro has no matching auth user, so nobody is locked out.

-- ── Link bros to auth users ───────────────────────────────────────────────

alter table bros add column auth_id uuid unique references auth.users (id) on delete set null;

update bros b
set auth_id = u.id
from auth.users u
where lower(u.email) = lower(b.email);

do $$
declare
  missing text;
begin
  select string_agg(email, ', ') into missing from bros where auth_id is null;
  if missing is not null then
    raise exception 'Create auth users for these bros first: %', missing;
  end if;
end $$;

-- Supabase Auth owns passwords now
alter table bros drop column password_hash;
drop function login(text, text);

-- ── Who is asking ─────────────────────────────────────────────────────────

-- The signed-in bro's id, or null. Security definer so policies on `bros` can call it.
create function current_bro_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from bros where auth_id = auth.uid();
$$;

revoke execute on function current_bro_id() from public, anon;
grant execute on function current_bro_id() to authenticated;

-- ── Row level security ────────────────────────────────────────────────────

alter table bros enable row level security;
alter table roasters enable row level security;
alter table roasts enable row level security;
alter table brews enable row level security;
alter table endorsements enable row level security;

-- Read: any signed-in user who is a bro (a stray auth user sees nothing)
create policy "bros can read" on bros
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "bros can read" on roasters
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "bros can read" on roasts
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "bros can read" on brews
  for select to authenticated using ((select current_bro_id()) is not null);
create policy "bros can read" on endorsements
  for select to authenticated using ((select current_bro_id()) is not null);

-- Write: only as yourself
create policy "add as yourself" on roasters
  for insert to authenticated with check (created_by = (select current_bro_id()));
create policy "add as yourself" on roasts
  for insert to authenticated with check (created_by = (select current_bro_id()));
create policy "add as yourself" on endorsements
  for insert to authenticated with check (bro_id = (select current_bro_id()));

create policy "add as yourself" on brews
  for insert to authenticated with check (bro_id = (select current_bro_id()));
create policy "finish your own" on brews
  for update to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));
create policy "discard your own" on brews
  for delete to authenticated using (bro_id = (select current_bro_id()));

-- ── Views respect RLS ─────────────────────────────────────────────────────

alter view active_brews set (security_invoker = on);
alter view latest_ratings set (security_invoker = on);
alter view roast_rankings set (security_invoker = on);
alter view roaster_rankings set (security_invoker = on);
alter view events set (security_invoker = on);

-- ── Anonymous visitors get nothing ────────────────────────────────────────

revoke all on all tables in schema public from anon;
