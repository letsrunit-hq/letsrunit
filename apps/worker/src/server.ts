import { serve } from '@hono/node-server';
import { connect, type Run } from '@letsrunit/model';
import { Hono } from 'hono';
import { handle } from './handle';

const app = new Hono();
const supabase = connect();

app.get('/', (c) => c.text('Worker is running'));

app.post('/tasks/run', async (c) => {
  try {
    const run = await c.req.json<Run>();
    console.log(`Received task for run "${run.id}"`);

    // We don't await handle(run) here because Cloud Tasks has a timeout,
    // and our runs can be long-running.
    // However, Cloud Tasks expects a 2xx response to acknowledge receipt.
    // If we want Cloud Tasks to manage retries based on run success/failure,
    // we should await it, but then we must ensure the timeout is sufficient.
    // Cloud Run has a max timeout of 60 mins. Cloud Tasks also has a timeout.
    // For now, let's await it to allow Cloud Tasks to retry if it fails.
    await handle(run, { supabase });

    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to process task', e);
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
