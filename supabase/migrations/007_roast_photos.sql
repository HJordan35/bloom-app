-- Bloom: bag photos for roasts (Roast Gallery, phase G1)

-- Public bucket: images load by URL without signing in, but it can't be listed.
insert into storage.buckets (id, name, public)
values ('roast-photos', 'roast-photos', true);

-- Linked bros can upload. Every upload gets a new path, so no update/delete.
create policy "bros can upload roast photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'roast-photos' and public.current_bro_id() is not null);

alter table roasts add column photo_original_path text;

-- Any bro can set a roast's photo, and nothing else about the roast.
revoke update on roasts from authenticated;
grant update (photo_original_path) on roasts to authenticated;

create policy "bros can set photos" on roasts
  for update to authenticated
  using ((select current_bro_id()) is not null)
  with check ((select current_bro_id()) is not null);
