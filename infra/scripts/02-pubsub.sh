#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${WORKER_URL:?}"

gcloud pubsub topics create runs --project "$PROJECT" || true

gcloud pubsub subscriptions create runs-push   --project "$PROJECT"   --topic runs   --push-endpoint="${WORKER_URL}"   --push-auth-service-account="worker-sa@${PROJECT}.iam.gserviceaccount.com"   --push-auth-token-audience="${WORKER_URL}" || true
