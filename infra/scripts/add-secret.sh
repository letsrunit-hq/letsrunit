#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"

WORKER_RUNTIME_SA_NAME="${WORKER_RUNTIME_SA_NAME:-worker-runtime-sa}"

gcloud secrets add-iam-policy-binding "NEW_SECRET" \
  --project "$PROJECT" \
  --member "serviceAccount:${WORKER_RUNTIME_SA_NAME}@${PROJECT}.iam.gserviceaccount.com" \
  --role "roles/secretmanager.secretAccessor"
