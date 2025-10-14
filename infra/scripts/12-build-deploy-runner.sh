#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"

IMG="${REGION}-docker.pkg.dev/${PROJECT}/runner/runner:latest"

gcloud artifacts repositories create runner   --repository-format=DOCKER   --location="$REGION"   --project "$PROJECT" || true

gcloud builds submit ../apps/runner --tag "$IMG" --project "$PROJECT"

gcloud run jobs deploy runner   --image "$IMG"   --region "$REGION"   --tasks 1   --max-retries 0   --task-timeout 600s   --service-account="runner-sa@${PROJECT}.iam.gserviceaccount.com"   --set-env-vars=GCP_PROJECT="${PROJECT}",GCP_REGION="${REGION}"   --project "$PROJECT"
