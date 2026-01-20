import { getCloudTasksClient } from '@/libs/google-cloud';
import { createRun, getRun, type WriteOptions } from '@letsrunit/model';

type RunInput = Parameters<typeof createRun>[0];

export async function queueRun(run: RunInput, opts: WriteOptions) {
  const id = await createRun(run, opts);

  const queueName = process.env.GCP_QUEUE_NAME || 'runs';
  const location = process.env.GCP_REGION || 'europe-west1';
  const project = process.env.GCP_PROJECT_ID || 'letsrunit';
  const workerUrl = process.env.GCP_WORKER_URL;
  const invokerSa = process.env.GCP_SERVICE_ACCOUNT_EMAIL || `${project}@appspot.gserviceaccount.com`;

  if (workerUrl) {
    const client = getCloudTasksClient();

    const fullRun = await getRun(id, opts);
    const parent = client.queuePath(project, location, queueName);

    const task = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: `${workerUrl}/tasks/run`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(JSON.stringify(fullRun)),
        oidcToken: {
          serviceAccountEmail: invokerSa,
          audience: workerUrl,
        },
      },
    };

    await client.createTask({ parent, task });
  }

  return id;
}
