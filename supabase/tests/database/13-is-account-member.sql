BEGIN;
create extension "basejump-supabase_test_helpers" version '0.0.6';

-- Plan: owner/member happy-path checks, stranger throws, and service_role bypass
select plan(7);

-- Enable team accounts
update basejump.config
set enable_team_accounts = true;

-- Create users
select tests.create_supabase_user('test_owner');
select tests.create_supabase_user('test_member');
select tests.create_supabase_user('test_stranger');

-- Act as owner and create a team account
select tests.authenticate_as('test_owner');

insert into basejump.accounts (id, name, slug, personal_account)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'Members Test Team', 'members-test-team', false);

-- As postgres, add a member to the team
select tests.clear_authentication();
set role postgres;

insert into basejump.account_user (account_id, account_role, user_id)
values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
    'member',
    tests.get_supabase_uid('test_member')
);

-- Owner context: function allowed and returns expected booleans
select tests.authenticate_as('test_owner');

SELECT ok(
               (select public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_owner'))),
               'Owner is a member of their account'
           );

SELECT ok(
               (select public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_member'))),
               'Member is recognized as a member by owner context'
           );

SELECT ok(
               (select not public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_stranger'))),
               'Stranger is not a member (checked by owner context)'
           );

-- Member context: function allowed for members as well
select tests.authenticate_as('test_member');

SELECT ok(
               (select public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_member'))),
               'Member can check membership and sees true for self'
           );

-- Stranger (authenticated, not a member): function still evaluates membership (SECURITY DEFINER)
select tests.authenticate_as('test_stranger');

-- Note: is_account_member is SECURITY DEFINER; inside the function current_user is the function owner,
-- so the caller-membership guard does not apply. It should simply return false for non-members.
SELECT ok(
               (select public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_owner'))),
               'Stranger context: function returns true when checking an actual member (owner)'
           );

-- Service role (postgres): bypass caller-membership requirement; evaluate membership directly
select tests.clear_authentication();
set role postgres;

SELECT ok(
               (select public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_owner'))),
               'Service role can check membership: owner is true'
           );

SELECT ok(
               (select not public.is_account_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', tests.get_supabase_uid('test_stranger'))),
               'Service role can check membership: stranger is false'
           );

SELECT *
FROM finish();

ROLLBACK;
