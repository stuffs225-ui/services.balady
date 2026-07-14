-- Health Certificate Mini System (Demo)
-- Core employees table.

create extension if not exists pgcrypto;

-- Generates a cryptographically secure, URL-safe, non-sequential token
-- with at least 128 bits of entropy. Used as a DB-level safety net; the
-- application also generates its own token client-side before insert.
create or replace function public.generate_public_token()
returns text
language sql
volatile
as $$
  select translate(
    encode(gen_random_bytes(16), 'base64'),
    '+/=',
    '-_'
  );
$$;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  public_token text unique not null default public.generate_public_token(),
  employee_name text not null,
  identity_number text not null,
  gender text not null,
  nationality text not null,
  profession text not null,
  authority_name text not null,
  municipality_name text not null,
  certificate_number text unique not null,
  license_number text,
  establishment_name text not null,
  establishment_number text,
  program_type text,
  issue_date_hijri text,
  issue_date_gregorian date not null,
  expiry_date_hijri text,
  expiry_date_gregorian date not null,
  program_completion_date_hijri text,
  employee_photo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_public_token_idx on public.employees (public_token);
create index if not exists employees_certificate_number_idx on public.employees (certificate_number);
create index if not exists employees_is_active_idx on public.employees (is_active);

-- Keep updated_at current on every row modification.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
  before update on public.employees
  for each row
  execute function public.set_updated_at();
