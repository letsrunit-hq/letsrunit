'use server';

import { connect } from '@/libs/supabase/server';
import { getUser } from '@/libs/auth';
import { updateFeature } from '@letsrunit/model';
import type { UUID } from 'node:crypto';

async function setFeatureEnabled(id: UUID, enabled: boolean): Promise<void> {
  const supabase = await connect();
  const user = await getUser({ supabase });
  await updateFeature(id, { enabled }, { by: user })
}

export async function enableFeature(id: UUID): Promise<void> {
  await setFeatureEnabled(id, true);
}

export async function disableFeature(id: UUID): Promise<void> {
  await setFeatureEnabled(id, false);
}
