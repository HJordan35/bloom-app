-- Bloom: studio versions of bag photos (Roast Gallery, phase G2)
-- Only the studio-photo Edge Function (service role) writes these columns.

alter table roasts
  add column photo_path text,
  add column photo_status text check (photo_status in ('processing', 'ready', 'failed'));
