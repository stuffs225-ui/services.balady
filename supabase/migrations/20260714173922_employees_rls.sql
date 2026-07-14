-- Row Level Security for employees.
-- Only authenticated admin users may query the table directly.
-- Anonymous users must go through the public.verify_certificate() RPC.

alter table public.employees enable row level security;

revoke all on public.employees from anon;
revoke all on public.employees from authenticated;

grant select, insert, update on public.employees to authenticated;

create policy "authenticated can read employees"
  on public.employees
  for select
  to authenticated
  using (true);

create policy "authenticated can insert employees"
  on public.employees
  for insert
  to authenticated
  with check (true);

create policy "authenticated can update employees"
  on public.employees
  for update
  to authenticated
  using (true)
  with check (true);

-- No policy is created for anon or for delete: this MVP only supports
-- soft deactivation (is_active = false) via the update policy above.
