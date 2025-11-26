
-- Visibility enum for projects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_visibility') THEN
        CREATE TYPE project_visibility AS ENUM ('private', 'public');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.projects
(
    id uuid unique NOT NULL DEFAULT uuid_generate_v4() primary key,
    -- If your model is owned by an account, you want to make sure you have an account_id column
    -- referencing the account table. Make sure you also set permissions appropriately
    account_id uuid not null references basejump.accounts(id),

    -- begin fields generated automatically from the template inputs
    url text,
    title text,
    description text,
    image text,
    favicon text,
    screenshot text,
    lang text,
    login_available boolean,
    visibility project_visibility NOT NULL DEFAULT 'private',
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
CREATE TRIGGER set_projects_timestamp
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_timestamps();

-- protect the updated_by and created_by columns by setting them to be read-only and managed by a trigger
CREATE TRIGGER set_projects_user_tracking
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_user_tracking();


-- enable RLS on the table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-------------
-- Users should be able to read records that are owned by an account they belong to
--------------
create policy "Account members can select" on public.projects
    for select
    to authenticated
    using (
    (account_id IN ( SELECT basejump.get_accounts_with_role()))
    );

----------------
-- Anyone (authenticated or anonymous) can read projects marked as public
----------------
create policy "Anyone can select public projects" on public.projects
    for select
    to authenticated, anon
    using (
    visibility = 'public'::project_visibility
    );


-- RPC: can_access_project(project_id, user_id)
-- Returns whether the given user can access the given project by delegating to is_account_member
create or replace function public.can_access_project(project_id uuid, user_id uuid)
    returns boolean
    language plpgsql
    security definer
    set search_path = public
as
$$
declare
    acc_id uuid;
begin
    -- Lookup the owning account of the project
    select p.account_id into acc_id
    from public.projects p
    where p.id = can_access_project.project_id;

    -- If project not found, deny
    if acc_id is null then
        return false;
    end if;

    -- Delegate to account membership check
    return public.is_account_member(acc_id, can_access_project.user_id);
end;
$$;

grant execute on function public.can_access_project(uuid, uuid) to authenticated, service_role;
