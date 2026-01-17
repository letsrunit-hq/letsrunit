import { serve } from '@hono/node-server';
import { connect, type Run, updateRunStatus } from '@letsrunit/model';
import { Hono } from 'hono';
import { handle } from './handle';

const app = new Hono();
const supabase = connect();

app.get('/', (c) => c.text('Worker is running'));

app.post('/tasks/run', async (c) => {
  let run: Run;
  try {
    run = await c.req.json<Run>();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON' }, 400);
  }

  if (!run?.id) return c.json({ success: false, error: 'Missing run.id' }, 400);

  const claimed = await updateRunStatus(run.id, 'running', { supabase });
  if (claimed) return c.json({ success: false, error: 'Run not queued' }, 404);

  try {
    await handle(run, { supabase });
    return c.json({ success: true });
  } catch (e) {
    console.error('Failed to process task', e);
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

const port = Number(process.env.PORT) || 8080;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});
