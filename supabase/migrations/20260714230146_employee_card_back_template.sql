-- Static background image for the second (instructions) page of the
-- printed employee card. Unlike the front template, this page has no
-- dynamic overlay fields or calibration — it is shown/exported exactly as
-- uploaded.

alter table public.site_settings
  add column if not exists employee_card_back_template_path text;
