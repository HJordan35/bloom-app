-- Bloom: brew notes vs results, endorsements tied to brews and editable
-- Run together with deploying the matching app build (the old build writes `result`).

-- "How I brewed it" vs "how it tasted"
alter table brews rename column result to brew_results;
alter table brews add column brew_notes text;

-- An endorsement can come from a brew (linked) or straight from a roast page (unlinked)
alter table endorsements add column brew_id uuid references brews (id) on delete set null;

-- Best-effort link for endorsements left on the old Finish panel:
-- same bro, roast and method, created within a minute of the brew finishing
update endorsements e
set brew_id = b.id
from brews b
where e.brew_id is null
  and e.bro_id = b.bro_id
  and e.roast_id = b.roast_id
  and e.method = b.method
  and b.finished_at is not null
  and abs(extract(epoch from e.created_at - b.finished_at)) < 60;

-- Bros can edit their own endorsements
create policy "edit your own" on endorsements
  for update to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));
