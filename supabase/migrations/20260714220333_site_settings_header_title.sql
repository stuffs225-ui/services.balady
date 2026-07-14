alter table public.site_settings
  add column if not exists header_title_text text not null default 'نظام الشهادات الصحية',
  add column if not exists header_subtitle_text text not null default '(نسخة تجريبية)';
