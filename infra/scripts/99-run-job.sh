#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"; : "${RUN_ID:?}"; : "${BUCKET:?}"

gcloud run jobs run runner   --region "$REGION"   --set-env-vars RUN_ID="${RUN_ID}",ARTIFACT_BUCKET="${BUCKET}",INPUT_URI="gs://${BUCKET}/runs/${RUN_ID}/input/job.json"   --project "$PROJECT"
