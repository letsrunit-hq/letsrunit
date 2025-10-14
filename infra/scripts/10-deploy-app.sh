#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"; : "${BUCKET:?}"

gcloud run deploy app   --source ../apps/app   --service-account="app-sa@${PROJECT}.iam.gserviceaccount.com"   --region "$REGION"   --set-env-vars GCP_PROJECT="${PROJECT}",GCP_REGION="${REGION}",ARTIFACT_BUCKET="${BUCKET}"   --allow-unauthenticated   --project "$PROJECT"
