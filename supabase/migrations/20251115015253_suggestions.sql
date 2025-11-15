
CREATE TABLE IF NOT EXISTS public.suggestions
(
    id uuid unique NOT NULL DEFAULT uuid_generate_v4() primary key,
    -- Suggestion belong to a project. RLS is enforced via the owning project's account_id
    project_id uuid not null references public.projects(id),

    -- begin fields generated automatically from the template inputs
    name text,
    description text,
    done text,
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
CREATE TRIGGER set_suggestions_timestamp
    BEFORE INSERT OR UPDATE ON public.suggestions
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_timestamps();

-- protect the updated_by and created_by columns by setting them to be read-only and managed by a trigger
CREATE TRIGGER set_suggestions_user_tracking
    BEFORE INSERT OR UPDATE ON public.suggestions
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_user_tracking();


-- enable RLS on the table
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;


-------------
-- Users should be able to read records that are owned by an account they belong to
--------------
create policy "Account members can select suggestions via project" on public.suggestions
  for select
  to authenticated
  using (
  exists (
    select 1
    from public.projects p
    where p.id = public.suggestions.project_id
      and p.account_id in (select basejump.get_accounts_with_role())
  )
  );
