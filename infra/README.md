# Infra (GCP) for LetsRunIt

This folder bootstraps and deploys a lean, GCP‑native setup:
- Cloud Run service: **app** (Next.js)
- Cloud Run service: **worker** (Pub/Sub push)
- Cloud Run **Job**: **runner** (Playwright sandbox)
- Pub/Sub topic/subscription, Firestore (Native), Cloud Storage bucket, IAM SAs/roles.

## Quick start

1) Set environment variables (see `env/dev.env.example`):
   ```bash
   export PROJECT=your-gcp-project
   export REGION=europe-west4
   export BUCKET=runs-artifacts-$PROJECT
   export WORKER_URL=https://worker-REPLACE.a.run.app/pubsub
   ```

2) Enable APIs:
   ```bash
   ./scripts/00-enable-apis.sh
   ```

3) Create Service Accounts + Roles:
   ```bash
   ./scripts/01-iam-service-accounts.sh
   ```

4) Pub/Sub (topic + push subscription):
   ```bash
   ./scripts/02-pubsub.sh
   ```

5) Storage bucket:
   ```bash
   ./scripts/03-storage.sh
   ```

6) Firestore (Native) + indexes (optional):
   ```bash
   ./scripts/04-firestore.sh
   ```

7) Deploy App & Worker (source deploy), then build & deploy Runner image+job:
   ```bash
   ./scripts/10-deploy-app.sh
   ./scripts/11-deploy-worker.sh
   ./scripts/12-build-deploy-runner.sh
   ```

8) (Optional) Manually trigger a job for testing:
   ```bash
   export RUN_ID=test-123
   ./scripts/99-run-job.sh
   ```

## Notes
- Ensure your `apps/app`, `apps/worker`, and `apps/runner` exist in the monorepo.
- `WORKER_URL` should be set **after** deploying the worker (copy the public URL).
- Firestore rules here are locked down; if your client needs reads, update rules accordingly.
- The bucket lifecycle deletes `runs/` objects after 14 days; adjust as needed.
