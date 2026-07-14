-- Private storage bucket for employee photos.
-- Object path convention: "<public_token>/photo" (no public URL, no
-- extension in the key — content-type is preserved as object metadata).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-photos',
  'employee-photos',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Admins (authenticated) may manage all objects in this bucket.
create policy "authenticated can read employee photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'employee-photos');

create policy "authenticated can upload employee photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'employee-photos');

create policy "authenticated can update employee photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'employee-photos')
  with check (bucket_id = 'employee-photos');

create policy "authenticated can delete employee photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'employee-photos');

-- Anonymous visitors may only read the photo of an active employee whose
-- public_token matches the first path segment of the object key. This is
-- what allows the public page to call createSignedUrl() safely: the path
-- is derived client-side from the token already present in the URL, so no
-- internal storage path is ever returned by the API.
create policy "public can read active employee photo"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'employee-photos'
    and exists (
      select 1
      from public.employees e
      where e.public_token = split_part(storage.objects.name, '/', 1)
        and e.is_active = true
    )
  );
