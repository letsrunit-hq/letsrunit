#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"; : "${BUCKET:?}"

gcloud run deploy worker   --source ../apps/worker   --service-account="worker-sa@${PROJECT}.iam.gserviceaccount.com"   --region "$REGION"   --set-env-vars GCP_PROJECT="${PROJECT}",GCP_REGION="${REGION}",ARTIFACT_BUCKET="${BUCKET}"   --no-allow-unauthenticated   --project "$PROJECT"
