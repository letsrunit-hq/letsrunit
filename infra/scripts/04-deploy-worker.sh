#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"; : "${REGION:?Missing REGION}"

# Usually: REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:TAG
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/letsrunit/worker:latest"

echo "Building worker image: ${IMAGE}"
# We build from the project root to include local packages
docker build -t "$IMAGE" -f apps/worker/Dockerfile .

echo "Pushing worker image: ${IMAGE}"
docker push "$IMAGE"

echo "Deploying worker using image: ${IMAGE}"

gcloud run deploy worker \
  --image "$IMAGE" \
  --service-account="worker-sa@${PROJECT}.iam.gserviceaccount.com" \
  --region "$REGION" \
  --set-env-vars GCP_PROJECT="${PROJECT}",GCP_REGION="${REGION}" \
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,TESTMAIL_API_KEY=TESTMAIL_API_KEY:latest,LANGSMITH_ENDPOINT=LANGSMITH_ENDPOINT:latest,LANGSMITH_API_KEY=LANGSMITH_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest" \
  --no-allow-unauthenticated \
  --project "$PROJECT"
