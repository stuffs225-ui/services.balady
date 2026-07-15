-- Admin-editable label/destination for the mobile nav's primary action
-- button (currently the static "بوابة الأعمال التجريبية" button). Defaults
-- match what's hardcoded in src/config/siteLinks.ts today, so behavior is
-- unchanged until an admin edits it from /settings.
alter table public.site_settings
  add column if not exists primary_action_label text
    not null default 'بوابة الأعمال التجريبية',
  add column if not exists primary_action_href text
    not null default '/business-portal';
