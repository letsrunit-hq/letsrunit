import { connect, type Data, fromData, type Run, RunSchema } from '@letsrunit/model';
import { handle } from './handle';

const supabase = connect();

supabase
  .channel('runs')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'runs' }, async (payload) => {
    try {
      const run = fromData(RunSchema)(payload.new as Data<Run>);

      if (run.status !== 'queued') {
        console.log(`Skipping run "${run.id}" because status is "${run.status}"`)
        return;
      }

      console.log(`Received run "${run.id}"`);
      await handle(run, { supabase });
    } catch (e) {
      console.error(`Run "${payload.new.id}" failed`, e);
    }
  })
  .subscribe((status) => {
    console.log(status);
  });
