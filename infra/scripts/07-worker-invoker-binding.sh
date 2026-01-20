#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

WORKER_SERVICE_NAME="${WORKER_SERVICE_NAME:-worker}"
TASKS_INVOKER_SA_NAME="${TASKS_INVOKER_SA_NAME:-tasks-invoker-sa}"

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
  create_sa_if_missing "$TASKS_INVOKER_SA_NAME"
  local tasks_invoker_sa="serviceAccount:${TASKS_INVOKER_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

  echo "Verify Cloud Run service exists: ${WORKER_SERVICE_NAME}"
  gcloud run services describe "$WORKER_SERVICE_NAME" \
    --platform managed \
    --project "$PROJECT" \
    --region "$REGION" >/dev/null

  echo "Grant Cloud Run invoke to tasks-invoker SA (service-level): ${WORKER_SERVICE_NAME}"
  gcloud run services add-iam-policy-binding "$WORKER_SERVICE_NAME" \
    --platform managed \
    --project "$PROJECT" \
    --region "$REGION" \
    --member "$tasks_invoker_sa" \
    --role "roles/run.invoker" \
    --quiet

  echo "Worker invoker binding configured."
}

main
