# Infra (GCP) for LetsRunIt

This folder bootstraps and deploys a lean, GCP‑native setup for workers. The web app is hosted on Vercel.

- Cloud Run service: **worker** (Cloud Tasks target)
- Cloud Tasks queue, IAM SAs/roles, Secret Manager.

Supabase is used for the database and is not part of this infra setup.

## Quick start

1) Set environment variables:
   ```bash
   export PROJECT=your-gcp-project
   export REGION=europe-west4
   ```

2) Enable APIs:
   ```bash
   ./scripts/00-enable-apis.sh
   ```

3) Create Service Accounts + Roles:
   ```bash
   ./scripts/01-iam-service-accounts.sh
   ```

4) Cloud Tasks (queue):
   ```bash
   ./scripts/02-cloud-tasks.sh
   ```

5) Secret Manager (upload secrets):
   ```bash
   export SUPABASE_URL=...
   export SUPABASE_SERVICE_ROLE_KEY=...
   export RESEND_API_KEY=...
   export LANGSMITH_ENDPOINT=...
   export LANGSMITH_API_KEY=...
   export OPENAI_API_KEY=...
   ./scripts/03-secrets.sh
   ```

6) Deploy Worker (bootstrap):
   ```bash
   ./scripts/04-deploy-worker.sh
   ```

## CI/CD Deployment (GitHub Actions)

The worker is automatically deployed via GitHub Actions when pushing to `main`. It uses **Workload Identity Federation (WIF)** to authenticate with GCP without using long-lived service account keys.

### 1. Configure Workload Identity Federation

Run this script to set up WIF for your GitHub repository:

```bash
export REPO="REPO_OWNER/REPO_NAME" # e.g. letsrunit/letsrunit
./scripts/05-setup-wif.sh
```

### 2. GitHub Repository Variables

Add the following to your GitHub repository **Settings > Secrets and variables > Actions > Variables**:

- `GCP_PROJECT_ID`: Your GCP project ID.
- `GCP_REGION`: Your GCP region (e.g., `europe-west4`).
- `GCP_WIF_PROVIDER`: The full path of the Workload Identity Provider.
  - Format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
  - Get it via the output of the setup script.
- `GCP_WIF_SERVICE_ACCOUNT`: The email of the service account created above.
  - Format: `github-actions-sa@${PROJECT}.iam.gserviceaccount.com`

## Notes
- Ensure your `apps/worker` exists in the monorepo.
