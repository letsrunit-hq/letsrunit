#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

REPO_NAME="${REPO_NAME:-letsrunit}"

SECRETS=(
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "TESTMAIL_API_KEY"
  "LANGSMITH_ENDPOINT"
  "LANGSMITH_API_KEY"
  "OPENAI_API_KEY"
)

WORKER_RUNTIME_SA_NAME="${WORKER_RUNTIME_SA_NAME:-worker-runtime-sa}"

create_sa_if_missing() {
  local name="$1"
  local email="${name}@${PROJECT}.iam.gserviceaccount.com"
  if gcloud iam service-accounts describe "$email" --project "$PROJECT" >/dev/null 2>&1; then
    echo "Service account exists: ${email}"
  else
    echo "Creating service account: ${email}"
    gcloud iam service-accounts create "$name" --project "$PROJECT" >/dev/null
  fi
}

main() {
  create_sa_if_missing "$WORKER_RUNTIME_SA_NAME"
  local worker_runtime_sa="serviceAccount:${WORKER_RUNTIME_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

  echo "Grant Secret Manager access to worker runtime SA (per-secret)"
  for secret in "${SECRETS[@]}"; do
    gcloud secrets add-iam-policy-binding "$secret" \
      --project "$PROJECT" \
      --member "$worker_runtime_sa" \
      --role "roles/secretmanager.secretAccessor"
  done

  # Ensure Cloud Run service agent can pull images from this repo
  local project_number
  project_number="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
  local run_agent="service-${project_number}@serverless-robot-prod.iam.gserviceaccount.com"

  echo "Grant Artifact Registry reader to Cloud Run service agent (repo-level): ${REPO_NAME}"
  gcloud artifacts repositories add-iam-policy-binding "$REPO_NAME" \
    --project "$PROJECT" \
    --location "$REGION" \
    --member "serviceAccount:${run_agent}" \
    --role "roles/artifactregistry.reader" || true

  echo "Worker IAM configured."
}

main
