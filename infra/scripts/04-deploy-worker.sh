#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"; : "${REGION:?Missing REGION}"

# Usually: REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:TAG
REPO_NAME="letsrunit"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO_NAME}/worker:latest"

# Check if repository already exists
if gcloud artifacts repositories describe "$REPO_NAME" --project="$PROJECT" --location="$REGION" >/dev/null 2>&1; then
  echo "Repository $REPO_NAME already exists in $REGION."
else
  echo "Creating Artifact Registry repository: $REPO_NAME in $REGION..."
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for Let's Run It" \
    --project="$PROJECT"
fi

echo "Configuring Docker authentication for $REGION..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet --project="$PROJECT"

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
