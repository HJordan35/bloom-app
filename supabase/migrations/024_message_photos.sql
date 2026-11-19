-- Bloom: photos on the message board (Messenger, phase M4)

-- Public bucket: images load by URL without signing in, but it can't be listed.
insert into storage.buckets (id, name, public)
values ('message-photos', 'message-photos', true);

-- Each bro's photos live under their id (<bro id>/<uuid>.jpg): add and delete only your own.
create policy "bros can upload message photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-photos'
    and (storage.foldername(name))[1] = public.current_bro_id()::text
  );

-- Removing a file needs select as well as delete (the public URL needs neither)
create policy "bros can see their message photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'message-photos'
    and (storage.foldername(name))[1] = public.current_bro_id()::text
  );

create policy "bros can delete their message photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'message-photos'
    and (storage.foldername(name))[1] = public.current_bro_id()::text
  );
