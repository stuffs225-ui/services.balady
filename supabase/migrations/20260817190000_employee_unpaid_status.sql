-- Tracks whether an employee still owes payment, plus an optional private
-- note about why/details — admin-only (never selected by verify_certificate()
-- or shown on the public certificate page), used by the employees list
-- badge and the unpaid-employees PDF report.
alter table public.employees
  add column if not exists is_unpaid boolean not null default false,
  add column if not exists unpaid_note text;
