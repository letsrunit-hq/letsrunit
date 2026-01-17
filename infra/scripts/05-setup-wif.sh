#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REPO:?Missing REPO (e.g. owner/repo)}"

echo "Setting up Workload Identity Federation for ${REPO} in project ${PROJECT}..."

# 1. Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="${PROJECT}" \
  --location="global" \
  --display-name="GitHub Actions Pool" || true

# 2. Create a Workload Identity Provider for GitHub
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == \"${REPO}\"" \
  --issuer-uri="https://token.actions.githubusercontent.com" || true

# 3. Create a Service Account for CI/CD
gcloud iam service-accounts create "github-actions-sa" \
  --project="${PROJECT}" \
  --display-name="GitHub Actions CI/CD" || true

# Wait for SA propagation
sleep 5

# 4. Grant the Service Account necessary permissions
echo "Granting roles/run.admin..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/run.admin" --quiet # Removed --condition=None

echo "Granting roles/iam.serviceAccountUser..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" --quiet

echo "Granting roles/artifactregistry.admin..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin" --quiet

# 5. Allow GitHub to impersonate the Service Account
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT}" --format='value(projectNumber)')

echo "Allowing GitHub to impersonate the Service Account..."
gcloud iam service-accounts add-iam-policy-binding "github-actions-sa@${PROJECT}.iam.gserviceaccount.com" \
  --project="${PROJECT}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}" \
  --quiet

echo ""
echo "WIF Setup Complete!"
echo "-------------------"
echo "GitHub Repository Variables to set:"
echo ""
echo "GCP_PROJECT_ID: ${PROJECT}"
echo "GCP_REGION: (your region, e.g., europe-west4)"
echo "GCP_WIF_PROVIDER: projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "GCP_WIF_SERVICE_ACCOUNT: github-actions-sa@${PROJECT}.iam.gserviceaccount.com"
