import { runJob } from '@letsrunit/executor/src';
import { Storage } from '@google-cloud/storage';
import type { Job } from '@letsrunit/core/types';

const runId = process.env.RUN_ID!;
const inputUri = process.env.INPUT_URI!;
const bucketName = process.env.ARTIFACT_BUCKET!;

(async () => {
  const storage = new Storage();
  const [_, , bkt, ...p] = inputUri.split('/');
  const [buf] = await storage.bucket(bkt).file(p.join('/')).download();
  const job = JSON.parse(buf.toString()) as Job;

  const artifactSink = async (name: string, data: Buffer) => {
    await storage.bucket(bucketName).file(`runs/${runId}/artifacts/${name}`).save(data);
  };

  const result = await runJob(job, { artifactSink });

  if (result.status === 'success') process.exit(0);
  process.exit(10);
})();
