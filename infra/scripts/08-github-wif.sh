#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REPO:?Missing REPO (e.g. owner/repo)}"

echo "Setting up Workload Identity Federation for ${REPO} in project ${PROJECT}..."

# Helpers
create_pool_if_missing() {
  local pool_id="$1"
  local display_name="$2"
  local state
  state=$(gcloud iam workload-identity-pools describe "$pool_id" \
    --project "$PROJECT" --location "global" --format='value(state)' 2>/dev/null || echo "NOT_FOUND")

  if [[ "$state" == "ACTIVE" ]]; then
    echo "Workload Identity Pool exists and is ACTIVE: ${pool_id}"
  elif [[ "$state" == "DELETED" ]]; then
    echo "Workload Identity Pool exists but is DELETED. Undeleting: ${pool_id}"
    gcloud iam workload-identity-pools undelete "$pool_id" \
      --project "$PROJECT" --location "global" >/dev/null
  else
    echo "Creating Workload Identity Pool: ${pool_id}"
    gcloud iam workload-identity-pools create "$pool_id" \
      --project="${PROJECT}" \
      --location="global" \
      --display-name="${display_name}" >/dev/null
  fi
}

create_provider_if_missing() {
  local provider_id="$1"
  local pool_id="$2"
  local display_name="$3"
  local issuer_uri="$4"
  local attribute_mapping="$5"
  local attribute_condition="$6"

  local state
  state=$(gcloud iam workload-identity-pools providers describe "$provider_id" \
    --project "$PROJECT" --location "global" --workload-identity-pool "$pool_id" --format='value(state)' 2>/dev/null || echo "NOT_FOUND")

  if [[ "$state" == "ACTIVE" ]]; then
    echo "Workload Identity Provider exists and is ACTIVE: ${provider_id}"
    return 0
  elif [[ "$state" == "DELETED" ]]; then
    echo "Workload Identity Provider exists but is DELETED. Undeleting: ${provider_id}"
    gcloud iam workload-identity-pools providers undelete "$provider_id" \
      --project "$PROJECT" --location "global" --workload-identity-pool "$pool_id" >/dev/null
    return 0
  fi

  echo "Creating Workload Identity Provider: ${provider_id}"
  gcloud iam workload-identity-pools providers create-oidc "${provider_id}" \
    --project="${PROJECT}" \
    --location="global" \
    --workload-identity-pool="${pool_id}" \
    --display-name="${display_name}" \
    --attribute-mapping="${attribute_mapping}" \
    --attribute-condition="${attribute_condition}" \
    --issuer-uri="${issuer_uri}" >/dev/null
}

create_sa_if_missing() {
  local name="$1"
  local display_name="$2"
  local email="${name}@${PROJECT}.iam.gserviceaccount.com"
  if gcloud iam service-accounts describe "$email" --project "$PROJECT" >/dev/null 2>&1; then
    echo "Service account exists: ${email}"
  else
    echo "Creating service account: ${email}"
    gcloud iam service-accounts create "$name" \
      --project="${PROJECT}" \
      --display-name="${display_name}" >/dev/null
  fi
}

# 1. Create a Workload Identity Pool
create_pool_if_missing "github-pool" "GitHub Actions Pool"

# 2. Create a Workload Identity Provider for GitHub
create_provider_if_missing "github-provider" "github-pool" "GitHub Actions Provider" \
  "https://token.actions.githubusercontent.com" \
  "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  "assertion.repository == \"${REPO}\""

# 3. Create a Service Account for CI/CD
create_sa_if_missing "github-actions-sa" "GitHub Actions CI/CD"

# Wait for SA propagation
sleep 5

# 4. Grant the Service Account necessary permissions
echo "Granting roles/run.admin..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/run.admin" # Removed --condition=None

echo "Granting roles/iam.serviceAccountUser..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

echo "Granting roles/artifactregistry.admin..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

# 5. Allow GitHub to impersonate the Service Account
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT}" --format='value(projectNumber)')

echo "Allowing GitHub to impersonate the Service Account..."
gcloud iam service-accounts add-iam-policy-binding "github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --project="${PROJECT}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"

echo ""
echo "WIF Setup Complete!"
echo "-------------------"
echo "GitHub Repository Variables to set:"
echo ""
echo "GCP_PROJECT_ID: ${PROJECT}"
echo "GCP_REGION: ${REGION}"
echo "GCP_WIF_PROVIDER: projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "GCP_WIF_SERVICE_ACCOUNT: github-actions-sa@${PROJECT}.iam.gserviceaccount.com"
