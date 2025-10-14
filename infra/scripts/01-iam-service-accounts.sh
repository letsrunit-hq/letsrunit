#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"

gcloud iam service-accounts create app-sa     --project "$PROJECT" || true
gcloud iam service-accounts create worker-sa  --project "$PROJECT" || true
gcloud iam service-accounts create runner-sa  --project "$PROJECT" || true

gcloud projects add-iam-policy-binding "$PROJECT"   --member="serviceAccount:app-sa@${PROJECT}.iam.gserviceaccount.com"   --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding "$PROJECT"   --member="serviceAccount:worker-sa@${PROJECT}.iam.gserviceaccount.com"   --role="roles/pubsub.subscriber"
gcloud projects add-iam-policy-binding "$PROJECT"   --member="serviceAccount:worker-sa@${PROJECT}.iam.gserviceaccount.com"   --role="roles/run.jobsAdmin"
gcloud projects add-iam-policy-binding "$PROJECT"   --member="serviceAccount:worker-sa@${PROJECT}.iam.gserviceaccount.com"   --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT"   --member="serviceAccount:runner-sa@${PROJECT}.iam.gserviceaccount.com"   --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding "$PROJECT"   --member="serviceAccount:runner-sa@${PROJECT}.iam.gserviceaccount.com"   --role="roles/datastore.user"
