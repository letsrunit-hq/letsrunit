# Infra (GCP) for LetsRunIt

This folder bootstraps and deploys a lean, GCP‑native setup for workers. The web app is hosted on Vercel.

- Cloud Run service: **worker** (Cloud Tasks target)
- Cloud Tasks queue, IAM SAs/roles, Secret Manager.

Supabase is used for the database and is not part of this infra setup.

## Prerequisites

1.  GCP Project created and `gcloud` CLI authenticated.
2.  `jq` installed for verification and helper scripts.
3.  Vercel CLI installed and linked (if using `vercel-config.sh push`).

## Environment Variables

Most scripts require the following variables to be set:

```bash
export PROJECT=your-gcp-project
export REGION=europe-west1
```

## Setup Sequence

Run the scripts in the following order to bootstrap the infrastructure:

1.  **Enable APIs**:
    ```bash
    ./scripts/00-enable-apis.sh
    ```

2.  **Upload Secrets**:
    Set the required secret values and run:
    ```bash
    export SUPABASE_URL=...
    export SUPABASE_SERVICE_ROLE_KEY=...
    export TESTMAIL_API_KEY=...
    export LANGSMITH_ENDPOINT=...
    export LANGSMITH_API_KEY=...
    export OPENAI_API_KEY=...
    ./scripts/01-secrets.sh
    ```

3.  **Artifact Registry**:
    Creates the Docker repository and grants permissions:
    ```bash
    ./scripts/02-artifact-registry.sh
    ```

4.  **Cloud Tasks**:
    Creates the task queue:
    ```bash
    ./scripts/03-cloud-tasks.sh
    ```

5.  **Worker IAM**:
    Creates the worker runtime SA and grants access to secrets and registry:
    ```bash
    ./scripts/04-worker-iam.sh
    ```

6.  **Vercel WIF**:
    Sets up Workload Identity Federation for Vercel:
    ```bash
    export VERCEL_TEAM_SLUG=your-team
    export VERCEL_PROJECT_NAME=your-project
    export VERCEL_ENV=production
    ./scripts/05-vercel-wif.sh
    ```

7.  **Deploy Worker**:
    Builds and deploys the worker service to Cloud Run:
    ```bash
    ./scripts/06-deploy-worker.sh
    ```

8.  **Worker Invoker Binding**:
    Allows Cloud Tasks to invoke the worker service:
    ```bash
    ./scripts/07-worker-invoker-binding.sh
    ```

9.  **GitHub WIF**:
    Sets up Workload Identity Federation for GitHub Actions:
    ```bash
    export REPO="owner/repo"
    ./scripts/08-github-wif.sh
    ```

## Utility Scripts

The following scripts provide auxiliary functionality for maintenance and verification:

### `verify.sh`
Performs a comprehensive check of the infrastructure state, ensuring APIs are enabled, secrets exist, and IAM bindings are correctly configured. It does not fail fast, providing a full report of all checks.
```bash
./scripts/verify.sh
```

### `reset.sh`
Safely "empties" the infrastructure. Instead of deleting resources with long tombstone periods (Queues, SAs, WIF Pools), it purges tasks and removes IAM bindings. It prompts for confirmation before each major step.
```bash
./scripts/reset.sh
```

### `vercel-config.sh`
Displays or pushes the required environment variables to Vercel.
- **Display**: `./scripts/vercel-config.sh`
- **Push**: `./scripts/vercel-config.sh push --environment=production`

### `copy-secrets.sh`
Copies all secrets from a source GCP project to a target GCP project.
```bash
./scripts/copy-secrets.sh SOURCE_PROJECT TARGET_PROJECT
```

### `add-secret.sh`
A helper script to grant the worker runtime service account access to a specific secret. (Note: Edit the script to specify the secret name).

## CI/CD Deployment (GitHub Actions)

The worker is automatically deployed via GitHub Actions when pushing to `main`. It uses **Workload Identity Federation (WIF)** to authenticate with GCP.

Add the following to your GitHub repository **Settings > Secrets and variables > Actions > Variables**:

- `GCP_PROJECT_ID`: Your GCP project ID.
- `GCP_REGION`: Your GCP region.
- `GCP_WIF_PROVIDER`: The full path of the Workload Identity Provider (output by `08-github-wif.sh`).
- `GCP_WIF_SERVICE_ACCOUNT`: `github-actions-sa@${PROJECT}.iam.gserviceaccount.com`

## Notes
- Ensure your `apps/worker` exists in the monorepo.
