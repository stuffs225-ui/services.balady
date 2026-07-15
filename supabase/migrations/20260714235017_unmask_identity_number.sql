-- Show the full identity number on the public verification page instead of
-- a masked version (admin decision: the page is the intended full-detail
-- verification surface, not a partial-reveal one).

create or replace function public.verify_certificate(p_token text)
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
  status text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Reject empty/malformed input cheaply without a table lookup.
  if p_token is null or length(p_token) < 8 then
    return;
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
    case
      when not e.is_active then 'revoked'
      when e.expiry_date_gregorian < current_date then 'expired'
      else 'active'
    end as status
  from public.employees e
  where e.public_token = p_token
  limit 1;
end;
$$;

-- Only anon/authenticated may call the RPC; the function itself is the
-- only sanctioned path to employee data for unauthenticated users.
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
