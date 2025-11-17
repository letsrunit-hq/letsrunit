-- Enum type for journal entry kinds, aligned with Zod EntryTypeSchema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'journal_entry_type' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.journal_entry_type AS ENUM (
            'debug',
            'info',
            'title',
            'warn',
            'error',
            'prepare',
            'success',
            'failure'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.journal_entries
(
    id uuid unique NOT NULL DEFAULT uuid_generate_v4() primary key,
    -- Journals belong to a run. RLS is enforced via the owning project's account_id
    run_id uuid not null references public.runs(id),

    -- begin fields generated automatically from the template inputs
    type public.journal_entry_type not null,
    message text not null,
    meta jsonb not null default '{}'::jsonb,
    artifacts jsonb not null default '[]'::jsonb,
    -- end fields generated automatically from the template inputs

    -- timestamps are useful for auditing
    -- Basejump has some convenience functions defined below for automatically handling these
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    -- Useful for tracking who made changes to a record
    -- Basejump has some convenience functions defined below for automatically handling these
    updated_by uuid references auth.users(id),
    created_by uuid references auth.users(id)
);


-- protect the timestamps by setting created_at and updated_at to be read-only and managed by a trigger
CREATE TRIGGER set_journal_entries_timestamp
    BEFORE INSERT OR UPDATE ON public.journal_entries
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_timestamps();

-- protect the updated_by and created_by columns by setting them to be read-only and managed by a trigger
CREATE TRIGGER set_journal_entries_user_tracking
    BEFORE INSERT OR UPDATE ON public.journal_entries
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_user_tracking();


-- enable RLS on the table
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;


-------------
-- Users should be able to read records that are owned by an account they belong to
--------------
create policy "Account members can select journal entries via project" on public.journal_entries
  for select
  to authenticated
  using (
  exists (
    select 1
    from public.runs r inner join public.projects p on r.project_id = p.id
    where r.id = public.journal_entries.run_id
      and p.account_id in (select basejump.get_accounts_with_role())
  )
  );

----------------
-- Anyone (authenticated or anonymous) can read journal_entries belonging to public projects
----------------
create policy "Anyone can select journal entries of public projects" on public.journal_entries
  for select
  to authenticated, anon
  using (
  exists (
    select 1
    from public.runs r inner join public.projects p on r.project_id = p.id
    where r.id = public.journal_entries.run_id
      and p.visibility = 'public'::project_visibility
  )
  );
