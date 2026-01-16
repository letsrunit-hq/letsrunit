#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"

gcloud iam service-accounts create worker-sa  --project "$PROJECT" || true

gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:worker-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer"
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:worker-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:worker-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
