-- Adds admin-editable trust-banner disclaimer text and an optional
-- accessibility-tools link destination to site_settings.
-- Defaults match the text previously hardcoded in PublicTrustBanner, so
-- behavior is unchanged until an admin edits them from /settings.

alter table public.site_settings
  add column if not exists trust_banner_text text
    not null default 'نسخة تجريبية غير تابعة لأي جهة حكومية',
  add column if not exists accessibility_link_href text;
