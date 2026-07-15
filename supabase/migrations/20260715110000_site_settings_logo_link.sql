-- Optional URL the header logo links to on the public page, e.g. the
-- organization's main website. Null keeps the logo non-clickable (current
-- behavior).
alter table public.site_settings
  add column if not exists logo_link_href text;
