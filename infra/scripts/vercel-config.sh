#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

WEB_SA_NAME="${WEB_SA_NAME:-web-sa}"
POOL_ID="${POOL_ID:-vercel}"
PROVIDER_ID="${PROVIDER_ID:-vercel}"
TASKS_INVOKER_SA_NAME="${TASKS_INVOKER_SA_NAME:-tasks-invoker-sa}"
QUEUE_NAME="${QUEUE_NAME:-runs}"

web_sa_email="${WEB_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
tasks_invoker_sa_email="${TASKS_INVOKER_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
project_number="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
worker_url="$(gcloud run services describe worker --platform managed --region "$REGION" --project "$PROJECT" --format 'value(status.url)' 2>/dev/null || echo "NOT_DEPLOYED_YET")"

# Prepare variables
vars=(
  "GCP_PROJECT_ID=${PROJECT}"
  "GCP_PROJECT_NUMBER=${project_number}"
  "GCP_SERVICE_ACCOUNT_EMAIL=${web_sa_email}"
  "GCP_TASKS_INVOKER_SA_EMAIL=${tasks_invoker_sa_email}"
  "GCP_WIF_POOL_ID=${POOL_ID}"
  "GCP_WIF_PROVIDER_ID=${PROVIDER_ID}"
  "GCP_WORKER_URL=${worker_url}"
  "GCP_REGION=${REGION}"
  "GCP_QUEUE_NAME=${QUEUE_NAME}"
)

push_to_vercel() {
  local env="$1"
  echo "Pushing configuration to Vercel (Environment: $env)..."

  for var_pair in "${vars[@]}"; do
    local key="${var_pair%%=*}"
    local value="${var_pair#*=}"

    echo "  Setting $key..."
    # Remove if exists to avoid conflicts, then add
    vercel env rm "$key" "$env" -y >/dev/null 2>&1 || true
    echo -n "$value" | vercel env add "$key" "$env" --force
  done
  echo "Done."
}

# Main Logic
if [[ "${1:-}" == "push" ]]; then
  shift
  ENVIRONMENT=""
  for i in "$@"; do
    case $i in
      --environment=*)
        ENVIRONMENT="${i#*=}"
        shift
        ;;
      *)
        ;;
    esac
  done

  if [[ -z "$ENVIRONMENT" ]]; then
    echo "Error: --environment is required for push (production|preview|development)"
    exit 1
  fi

  push_to_vercel "$ENVIRONMENT"
else
  echo "Vercel Environment Variables:"
  echo "-----------------------------"
  for v in "${vars[@]}"; do
    echo "$v"
  done
fi
