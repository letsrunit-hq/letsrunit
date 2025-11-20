
-- Enum types for runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_type') THEN
        CREATE TYPE run_type AS ENUM ('explore', 'generate', 'test');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'run_status') THEN
        CREATE TYPE run_status AS ENUM ('queued', 'running', 'success', 'failed', 'error');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.runs
(
    id uuid unique NOT NULL DEFAULT uuid_generate_v4() primary key,
    -- Runs belong to a project. RLS is enforced via the owning project's account_id
    project_id uuid NOT NULL references public.projects(id),

    -- begin fields generated automatically from the template inputs
    feature_id uuid references public.features(id),
    type run_type NOT NULL,
    target text,
    status run_status NOT NULL,
    error text,
    -- explicitly nullable timestamps for run lifecycle
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
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


-- helpful composite index for common lookups by project and type
CREATE INDEX IF NOT EXISTS runs_project_type_idx
    ON public.runs (project_id, type);


-- protect the timestamps by setting created_at and updated_at to be read-only and managed by a trigger
CREATE TRIGGER set_runs_timestamp
    BEFORE INSERT OR UPDATE ON public.runs
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_timestamps();

-- protect the updated_by and created_by columns by setting them to be read-only and managed by a trigger
CREATE TRIGGER set_runs_user_tracking
    BEFORE INSERT OR UPDATE ON public.runs
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_user_tracking();


-- enable RLS on the table
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;


-------------
-- Users should be able to read records that are owned by an account they belong to
--------------
create policy "Account members can select runs via project" on public.runs
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.projects p
            where p.id = public.runs.project_id
              and p.account_id in (select basejump.get_accounts_with_role())
        )
    );

----------------
-- Anyone (authenticated or anonymous) can read runs belonging to public projects
----------------
create policy "Anyone can select runs of public projects" on public.runs
    for select
    to authenticated, anon
    using (
        exists (
            select 1
            from public.projects p
            where p.id = public.runs.project_id
              and p.visibility = 'public'::project_visibility
        )
    );
