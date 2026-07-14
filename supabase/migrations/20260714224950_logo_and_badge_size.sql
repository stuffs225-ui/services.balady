-- Admin-configurable display size (in pixels) for the header logo and the
-- footer badges/logo mark.

alter table public.site_settings
  add column if not exists logo_size integer not null default 96,
  add column if not exists footer_badge_size integer not null default 56;
