import { CloudTasksClient } from '@google-cloud/tasks';
import { createRun, getRun, type WriteOptions } from '@letsrunit/model';

type RunInput = Parameters<typeof createRun>[0];

export async function queueRun(run: RunInput, opts: WriteOptions) {
  const id = await createRun(run, opts);

  const queueName = process.env.QUEUE_NAME;
  const project = process.env.GCP_PROJECT;
  const location = process.env.GCP_REGION;
  const workerUrl = process.env.WORKER_URL;

  if (queueName && project && location && workerUrl) {
    const client = new CloudTasksClient();

    const fullRun = await getRun(id, opts);
    const parent = client.queuePath(project, location, queueName);

    const task = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: `${workerUrl}/tasks/run`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(JSON.stringify(fullRun)).toString('base64'),
        oidcToken: {
          serviceAccountEmail: process.env.CLOUD_TASKS_SA || `${project}@appspot.gserviceaccount.com`,
        },
      },
    };

    await client.createTask({ parent, task });
  }

  return id;
}
