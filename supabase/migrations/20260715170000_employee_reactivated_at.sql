-- Tracks when an employee was last reactivated after being deactivated.
-- The admin UI (employees list + the daily registration report) treats
-- this as the employee's effective "registration date" once set, instead
-- of created_at — so a reactivated employee is counted on the day they
-- came back, not their original signup day.
alter table public.employees
  add column if not exists reactivated_at timestamptz;
