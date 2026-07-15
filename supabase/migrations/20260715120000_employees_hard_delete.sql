-- Adds permanent deletion on top of the existing soft-deactivation flow.
-- Admins can now fully erase an employee's record (not just set
-- is_active = false) — the row is gone, and it never appears in the
-- platform or via the public verify_certificate() RPC again.

grant delete on public.employees to authenticated;

create policy "authenticated can delete employees"
  on public.employees
  for delete
  to authenticated
  using (true);
