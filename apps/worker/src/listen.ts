import { connect, fromData, type RunData, RunSchema } from '@letsrunit/model';
import { handle } from './handle';

const supabase = connect();

supabase
  .channel('runs')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'runs' }, async (payload) => {
    const run = fromData(RunSchema)(payload.new as RunData);
    if (run.status !== 'queued') return;

    await handle(run, { supabase });
  })
  .subscribe();
