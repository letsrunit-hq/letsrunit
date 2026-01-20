#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

REPO_NAME="${REPO_NAME:-letsrunit}"

# Create repo if missing
if gcloud artifacts repositories describe "$REPO_NAME" --project="$PROJECT" --location="$REGION" >/dev/null 2>&1; then
  echo "Artifact Registry repo exists: ${REPO_NAME} (${REGION})"
else
  echo "Creating Artifact Registry repo: ${REPO_NAME} (${REGION})"
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for Lets Run It" \
    --project="$PROJECT"
fi

# Allow Cloud Run to pull images
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
RUN_AGENT="service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com"

gcloud artifacts repositories add-iam-policy-binding "$REPO_NAME" \
  --project="$PROJECT" \
  --location="$REGION" \
  --member="serviceAccount:${RUN_AGENT}" \
  --role="roles/artifactregistry.reader" \
  --quiet || true

echo "Artifact Registry configured."
