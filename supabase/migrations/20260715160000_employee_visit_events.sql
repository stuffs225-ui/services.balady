-- Timestamped visit log, additive to the existing employees.visit_count
-- counter — the counter alone can't answer "how many visits in the last N
-- days" since it has no time dimension. verify_certificate() now logs one
-- row here per successful lookup (QR scan or direct link, same as the
-- counter), so admin-side stats (employees list page) can compute
-- recent-activity averages going forward. Admin-only read access; only the
-- SECURITY DEFINER verify_certificate() function ever writes to it.
create table if not exists public.employee_visit_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  visited_at timestamptz not null default now()
);

create index if not exists employee_visit_events_employee_id_idx
  on public.employee_visit_events (employee_id);
create index if not exists employee_visit_events_visited_at_idx
  on public.employee_visit_events (visited_at);

alter table public.employee_visit_events enable row level security;
revoke all on public.employee_visit_events from anon;
revoke all on public.employee_visit_events from authenticated;
grant select on public.employee_visit_events to authenticated;

drop policy if exists "authenticated can read employee visit events" on public.employee_visit_events;
create policy "authenticated can read employee visit events"
  on public.employee_visit_events
  for select
  to authenticated
  using (true);

drop function if exists public.verify_certificate(text);

create function public.verify_certificate(p_token text)
returns table (
  employee_name text,
  identity_number text,
  gender text,
  nationality text,
  profession text,
  authority_name text,
  municipality_name text,
  certificate_number text,
  license_number text,
  establishment_name text,
  establishment_number text,
  program_type text,
  issue_date_hijri text,
  issue_date_gregorian date,
  expiry_date_hijri text,
  expiry_date_gregorian date,
  program_completion_date_hijri text,
  has_photo boolean,
  employee_photo_crop jsonb,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
begin
  if p_token is null or length(p_token) < 8 then
    return;
  end if;

  select e.id into v_employee_id from public.employees e where e.public_token = p_token limit 1;

  if v_employee_id is not null then
    update public.employees
    set visit_count = visit_count + 1
    where id = v_employee_id;

    insert into public.employee_visit_events (employee_id)
    values (v_employee_id);
  end if;

  return query
  select
    e.employee_name,
    e.identity_number,
    e.gender,
    e.nationality,
    e.profession,
    e.authority_name,
    e.municipality_name,
    e.certificate_number,
    e.license_number,
    e.establishment_name,
    e.establishment_number,
    e.program_type,
    e.issue_date_hijri,
    e.issue_date_gregorian,
    e.expiry_date_hijri,
    e.expiry_date_gregorian,
    e.program_completion_date_hijri,
    (e.employee_photo_path is not null) as has_photo,
    e.employee_photo_crop,
    case
      when not e.is_active then 'revoked'
      when e.expiry_date_gregorian < current_date then 'expired'
      else 'active'
    end as status
  from public.employees e
  where e.id = v_employee_id;
end;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
