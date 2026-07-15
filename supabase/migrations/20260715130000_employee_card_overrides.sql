-- Per-employee card field overrides (font size and/or displayed text),
-- layered on top of the global employee_card_layout in site_settings so a
-- single employee's card can be adjusted without affecting everyone else's.
alter table public.employees
  add column if not exists employee_card_overrides jsonb;
