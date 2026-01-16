create extension if not exists pgcrypto with schema extensions;
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;

-- for future sessions, include the migration runner role(s)
grant usage  on schema extensions to anon, authenticated, service_role;
