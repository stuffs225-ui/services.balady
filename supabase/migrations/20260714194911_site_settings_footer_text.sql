-- Adds admin-editable footer copyright/support text to site_settings.
-- Defaults match the text that was previously hardcoded in PublicFooter,
-- so behavior is unchanged until an admin edits them from /settings.
-- "{year}" in footer_copyright_text is replaced with the current year at
-- render time.

alter table public.site_settings
  add column if not exists footer_copyright_text text
    not null default 'جميع الحقوق محفوظة للجهة التجريبية © {year}',
  add column if not exists footer_support_text text
    not null default 'تم تطوير وتشغيل النسخة التجريبية لأغراض العرض';
