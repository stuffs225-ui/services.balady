-- Employee card template: an admin-uploaded background image (PNG/JPG) plus
-- a saved JSON overlay configuration describing where each dynamic value
-- (name, photo, QR, identity number, etc.) sits on top of it, as
-- percentages of the image's natural size. The frontend never redraws or
-- recreates the background — it only overlays the dynamic values on top of
-- the uploaded image at print/preview time.

alter table public.site_settings
  add column if not exists employee_card_template_path text,
  add column if not exists employee_card_layout jsonb not null default '{}'::jsonb;

-- ---------- Employee card template bucket ----------
-- Public (not private): the template background must render on the admin
-- calibration screen and the printed card with no signed-URL round trip.
-- It is a blank template with no employee data in it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-card-template',
  'employee-card-template',
  true,
  8388608, -- 8 MB
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated can manage employee card template" on storage.objects;
create policy "authenticated can manage employee card template"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'employee-card-template')
  with check (bucket_id = 'employee-card-template');
