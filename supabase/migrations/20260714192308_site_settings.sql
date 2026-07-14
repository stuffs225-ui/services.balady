-- Editable site branding/navigation settings.
-- A single row (fixed id) holds the logo, nav links, footer links, and
-- footer badges so the admin can change branding/links without a code
-- deploy. Values are public by design (they render on every visitor's
-- page), so only writes are restricted to authenticated admins.

create table if not exists public.site_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  logo_path text,
  nav_links jsonb not null default '[]'::jsonb,
  footer_links jsonb not null default '[]'::jsonb,
  footer_badges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

insert into public.site_settings (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

revoke all on public.site_settings from anon;
revoke all on public.site_settings from authenticated;

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

create policy "anyone can read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy "authenticated can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (true)
  with check (true);

-- ---------- Public branding assets bucket ----------
-- Public (not private like employee-photos): logos/badges must render for
-- every anonymous visitor with no signed URL round trip.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding-assets',
  'branding-assets',
  true,
  2097152, -- 2 MB
  array['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated can manage branding assets" on storage.objects;
create policy "authenticated can manage branding assets"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'branding-assets')
  with check (bucket_id = 'branding-assets');
