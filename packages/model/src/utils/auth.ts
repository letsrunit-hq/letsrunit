import type { UUID } from '@letsrunit/utils';
import { connect } from '../supabase';
import type { ReadOptions, WriteOptions } from '../types';
import { DBError } from './db-error';

type Table = 'projects' | 'features' | 'runs';

export async function getProjectId(table: Table, id: UUID, opts: ReadOptions = {}): Promise<UUID> {
  const supabase = opts.supabase ?? connect();

  const { data, status, error } = await supabase.from(table).select('project_id').eq('id', id).maybeSingle();
  if (error) throw new DBError(status, error);
  if (!data) throw new DBError(403);

  return (data as { project_id: UUID }).project_id;
}

/**
 * Authorize that the acting user (opts.by) can write to the given record.
 * DRY helper mirroring RLS read logic.
 *
 * Rules:
 * - If no opts.by is provided, skip checks (allow).
 * - If table is 'projects', authorize directly on that project id.
 * - Otherwise resolve project_id from the table row, then validate membership
 *   against the project using public.can_access_project(project_id, user_id).
 */
export async function authorize(table: Table, id: UUID, opts: WriteOptions = {}): Promise<void> {
  // no user context → allow
  if (!opts.by?.id) return;

  const supabase = opts.supabase ?? connect();

  // Resolve project id
  const projectId = table === 'projects' ? id : await getProjectId(table, id, { supabase });

  const {
    data: isMember,
    status: mStatus,
    error: mErr,
  } = await supabase.rpc('can_access_project', {
    project_id: projectId,
    user_id: opts.by.id,
  });
  if (mErr) throw new DBError(mStatus, mErr);
  if (!isMember) throw new DBError(403);
}

export async function authorizeForAccount(accountId: UUID, opts: WriteOptions = {}) {
  if (!opts.by?.id || accountId === opts.by.id) return; // no user context or same user → allow

  const supabase = opts.supabase ?? connect();

  const {
    data: isMember,
    error: mErr,
    status: mStatus,
  } = await supabase.rpc('is_account_member', { account_id: accountId, user_id: opts.by.id });

  if (mErr) throw new DBError(mStatus, mErr);
  if (!isMember) throw new DBError(403);
}
