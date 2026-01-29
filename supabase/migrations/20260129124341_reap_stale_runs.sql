create or replace function public.reap_stale_runs(
  max_time interval default interval '1 hour'
)
returns int
language plpgsql
security definer
as $$
declare
  n int;
begin
  update public.runs
  set
    status = 'error',
    error = 'Run timed out',
    updated_at = now()
  where
    status in ('queued', 'running')
    and created_at < now() - max_time;

  get diagnostics n = row_count;
  return n;
end;
$$;
