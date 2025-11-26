
CREATE TABLE IF NOT EXISTS public.features
(
    id uuid unique NOT NULL DEFAULT uuid_generate_v4() primary key,
    -- Suggestion belong to a project. RLS is enforced via the owning project's account_id
    project_id uuid  NOT NULL references public.projects(id),

    -- begin fields generated automatically from the template inputs
    name text NOT NULL,
    description text,
    comments text,
    body text,
    enabled boolean NOT NULL default true,
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
CREATE TRIGGER set_features_timestamp
    BEFORE INSERT OR UPDATE ON public.features
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_timestamps();

-- protect the updated_by and created_by columns by setting them to be read-only and managed by a trigger
CREATE TRIGGER set_features_user_tracking
    BEFORE INSERT OR UPDATE ON public.features
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_user_tracking();


-- enable RLS on the table
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;


-------------
-- Users should be able to read records that are owned by an account they belong to
--------------
create policy "Account members can select features via project" on public.features
  for select
  to authenticated
  using (
  exists (
    select 1
    from public.projects p
    where p.id = public.features.project_id
      and p.account_id in (select basejump.get_accounts_with_role())
  )
  );
