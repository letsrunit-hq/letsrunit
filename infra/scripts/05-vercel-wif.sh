#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

: "${VERCEL_TEAM_SLUG:?Missing VERCEL_TEAM_SLUG}"       # e.g. acme
: "${VERCEL_PROJECT_NAME:?Missing VERCEL_PROJECT_NAME}" # e.g. my-project
: "${VERCEL_ENV:?Missing VERCEL_ENV}"                   # production | preview | development

QUEUE_NAME="${QUEUE_NAME:-runs}"

POOL_ID="${POOL_ID:-vercel}"
PROVIDER_ID="${PROVIDER_ID:-vercel}"
ISSUER_MODE="${ISSUER_MODE:-team}" # team | global

TASKS_INVOKER_SA_NAME="${TASKS_INVOKER_SA_NAME:-tasks-invoker-sa}"
WEB_SA_NAME="${WEB_SA_NAME:-web-sa}"

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

enable_api_if_possible() {
  local api="$1"
  gcloud services enable "$api" --project "$PROJECT" >/dev/null 2>&1 || true
}

create_pool_if_missing() {
  local state
  state=$(gcloud iam workload-identity-pools describe "$POOL_ID" \
    --project "$PROJECT" --location "global" --format='value(state)' 2>/dev/null || echo "NOT_FOUND")

  if [[ "$state" == "ACTIVE" ]]; then
    echo "Workload Identity Pool exists and is ACTIVE: ${POOL_ID}"
  elif [[ "$state" == "DELETED" ]]; then
    echo "Workload Identity Pool exists but is DELETED. Undeleting: ${POOL_ID}"
    gcloud iam workload-identity-pools undelete "$POOL_ID" \
      --project "$PROJECT" --location "global" >/dev/null
  else
    echo "Creating Workload Identity Pool: ${POOL_ID}"
    gcloud iam workload-identity-pools create "$POOL_ID" \
      --project "$PROJECT" \
      --location "global" \
      --display-name "Vercel" >/dev/null
  fi
}

create_provider_if_missing() {
  local state
  state=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
    --project "$PROJECT" --location "global" --workload-identity-pool "$POOL_ID" --format='value(state)' 2>/dev/null || echo "NOT_FOUND")

  if [[ "$state" == "ACTIVE" ]]; then
    echo "Workload Identity Provider exists and is ACTIVE: ${PROVIDER_ID}"
    return 0
  elif [[ "$state" == "DELETED" ]]; then
    echo "Workload Identity Provider exists but is DELETED. Undeleting: ${PROVIDER_ID}"
    gcloud iam workload-identity-pools providers undelete "$PROVIDER_ID" \
      --project "$PROJECT" --location "global" --workload-identity-pool "$POOL_ID" >/dev/null
    return 0
  fi

  local issuer_url
  local allowed_audience="https://vercel.com/${VERCEL_TEAM_SLUG}"

  if [[ "$ISSUER_MODE" == "global" ]]; then
    issuer_url="https://oidc.vercel.com"
  else
    issuer_url="https://oidc.vercel.com/${VERCEL_TEAM_SLUG}"
  fi

  echo "Creating Workload Identity Provider: ${PROVIDER_ID}"
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project "$PROJECT" \
    --location "global" \
    --workload-identity-pool "$POOL_ID" \
    --display-name "Vercel" \
    --issuer-uri "$issuer_url" \
    --allowed-audiences "$allowed_audience" \
    --attribute-mapping "google.subject=assertion.sub" >/dev/null
}

main() {
  enable_api_if_possible "iamcredentials.googleapis.com"

  create_sa_if_missing "$WEB_SA_NAME"
  local web_sa_email="${WEB_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
  local web_sa_member="serviceAccount:${web_sa_email}"

  echo "Grant Cloud Tasks enqueue to web SA (queue-level): ${QUEUE_NAME}"
  gcloud tasks queues add-iam-policy-binding "$QUEUE_NAME" \
    --project "$PROJECT" \
    --location "$REGION" \
    --member "$web_sa_member" \
    --role "roles/cloudtasks.enqueuer"

  create_pool_if_missing
  create_provider_if_missing

  local project_number
  project_number="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"

  local subject="owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:${VERCEL_ENV}"
  local principal="principal://iam.googleapis.com/projects/${project_number}/locations/global/workloadIdentityPools/${POOL_ID}/subject/${subject}"

  echo "Allow Vercel subject to impersonate web SA:"
  echo "  ${principal}"

  gcloud iam service-accounts add-iam-policy-binding "$web_sa_email" \
    --project "$PROJECT" \
    --member="$principal" \
    --role="roles/iam.workloadIdentityUser"

  gcloud iam service-accounts add-iam-policy-binding "$web_sa_email" \
    --project "$PROJECT" \
    --member="$principal" \
    --role="roles/iam.serviceAccountTokenCreator"

  gcloud iam service-accounts add-iam-policy-binding "$web_sa_email" \
    --project "$PROJECT" \
    --member="$principal" \
    --role="roles/iam.serviceAccountUser"

  local tasks_invoker_sa_email="${TASKS_INVOKER_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
  echo "Allow web SA to act as tasks-invoker SA"
  gcloud iam service-accounts add-iam-policy-binding "$tasks_invoker_sa_email" \
    --project "$PROJECT" \
    --member="serviceAccount:${web_sa_email}" \
    --role="roles/iam.serviceAccountUser"

  local worker_url
  worker_url="$(gcloud run services describe worker --platform managed --region "$REGION" --project "$PROJECT" --format 'value(status.url)' 2>/dev/null || echo "PENDING_DEPLOYMENT")"

  cat <<EOF

Done.

This script sets up Vercel -> GCP auth (WIF) and queue enqueue permissions.

Use these values in Vercel (env vars):
- GCP_PROJECT_ID=${PROJECT}
- GCP_PROJECT_NUMBER=${project_number}
- GCP_SERVICE_ACCOUNT_EMAIL=${web_sa_email}
- GCP_WIF_POOL_ID=${POOL_ID}
- GCP_WIF_PROVIDER_ID=${PROVIDER_ID}
- GCP_WORKER_URL=${worker_url}
- GCP_REGION=${REGION}
- GCP_QUEUE_NAME=${QUEUE_NAME}

EOF
}

main
