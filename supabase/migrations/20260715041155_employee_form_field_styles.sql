-- Admin-configurable text direction/alignment per field on the "add
-- employee" admin form, so the admin can fix/verify RTL alignment issues
-- themselves without a code deploy.

alter table public.site_settings
  add column if not exists employee_form_field_styles jsonb not null default '{}'::jsonb;
