/**
 * The listener is intended only for local development of the web application.
 * On production use Google Task queues.
 * Use the CLI for development of the packages / test run logic.
 */

import { connect, type Data, DBError, fromData, type Run, RunSchema } from '@letsrunit/model';
import { sleep } from '@letsrunit/utils';
import { handle } from './handle';

const TEST_SLEEP = Number(process.env.TEST_SLEEP || 0);

const supabase = connect();

async function processRun(data: Data<Run>) {
  try {
    const run = fromData(RunSchema)(data);

    if (run.status !== 'queued') {
      console.log(`Skipping run "${run.id}" because status is "${run.status}"`)
      return;
    }

    console.log(`Received run "${run.id}"`);
    await handle(run, { supabase });
  } catch (e) {
    console.error(`Run "${data.id}" failed`, e);
  }
}

// On startup: process any queued runs
async function processRecentQueuedRuns() {
  try {
    const { data: rows, error, status } = await supabase
      .from('runs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true });
    if (error) throw new DBError(status, error);

    await Promise.all(rows?.map((row) => processRun(row)));
  } catch (e) {
    console.error('Unexpected error while processing recent queued runs', e);
  }
}

void processRecentQueuedRuns(); // Fire and forget

// Realtime subscription to pick up new inserts
supabase
  .channel('runs')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'runs', filter: 'status=eq.queued' }, async (payload) => {
    if (TEST_SLEEP) await sleep(TEST_SLEEP);
    await processRun(payload.new as Data<Run>);
  })
  .subscribe((status) => {
    console.log('Run listener', status);
  });
