#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

echo "RESET project resources in PROJECT=${PROJECT}, REGION=${REGION}"
echo "This will delete Cloud Run services, Cloud Tasks queues, Artifact Registry repos, all Secret Manager secrets,"
echo "all user-managed service accounts, and all Workload Identity pools/providers."
echo

# Helpers
safe() {
  # Run command, do not fail the whole script
  "$@" >/dev/null 2>&1 || true
}

is_google_managed_sa() {
  # Google-managed service agents and some system accounts cannot/should not be deleted.
  local email="$1"
  [[ "$email" == *"@cloudservices.gserviceaccount.com" ]] && return 0
  [[ "$email" == *"@serverless-robot-prod.iam.gserviceaccount.com" ]] && return 0
  [[ "$email" == *"@gcp-sa-"*".iam.gserviceaccount.com" ]] && return 0
  [[ "$email" == *"@container-engine-robot.iam.gserviceaccount.com" ]] && return 0
  [[ "$email" == *"@compute-system.iam.gserviceaccount.com" ]] && return 0
  [[ "$email" == *"@developer.gserviceaccount.com" ]] && return 0
  [[ "$email" == *"@appspot.gserviceaccount.com" ]] && return 0
  return 1
}

echo "1) Cloud Run services (managed) in ${REGION}"
mapfile -t RUN_SERVICES < <(
  gcloud run services list \
    --platform managed \
    --project "$PROJECT" \
    --region "$REGION" \
    --format 'value(metadata.name)' 2>/dev/null || true
)
for s in "${RUN_SERVICES[@]}"; do
  [[ -z "$s" ]] && continue
  echo "  Deleting Cloud Run service: $s"
  safe gcloud run services delete "$s" --platform managed --project "$PROJECT" --region "$REGION" --quiet
done

echo "2) Cloud Tasks queues in ${REGION}"
mapfile -t QUEUES < <(
  gcloud tasks queues list \
    --project "$PROJECT" \
    --location "$REGION" \
    --format 'value(name)' 2>/dev/null | sed -E 's#.*/queues/##' || true
)
for q in "${QUEUES[@]}"; do
  [[ -z "$q" ]] && continue
  echo "  Deleting queue: $q"
  safe gcloud tasks queues delete "$q" --project "$PROJECT" --location "$REGION" --quiet
done

echo "3) Artifact Registry repos in ${REGION}"
mapfile -t REPOS < <(
  gcloud artifacts repositories list \
    --project "$PROJECT" \
    --location "$REGION" \
    --format 'value(name)' 2>/dev/null | sed -E 's#.*/repositories/##' || true
)
for r in "${REPOS[@]}"; do
  [[ -z "$r" ]] && continue
  echo "  Deleting repo: $r"
  safe gcloud artifacts repositories delete "$r" --project "$PROJECT" --location "$REGION" --quiet
done

echo "4) Secret Manager, delete ALL secrets"
mapfile -t SECRETS < <(
  gcloud secrets list --project "$PROJECT" --format 'value(name)' 2>/dev/null || true
)
for s in "${SECRETS[@]}"; do
  [[ -z "$s" ]] && continue
  echo "  Deleting secret: $s"
  safe gcloud secrets delete "$s" --project "$PROJECT" --quiet
done

echo "5) Workload Identity Pools (global), delete ALL pools and providers"
mapfile -t POOLS < <(
  gcloud iam workload-identity-pools list \
    --project "$PROJECT" \
    --location global \
    --format 'value(name)' 2>/dev/null | sed -E 's#.*/workloadIdentityPools/##' || true
)
for p in "${POOLS[@]}"; do
  [[ -z "$p" ]] && continue
  echo "  Deleting providers in pool: $p"
  mapfile -t PROVS < <(
    gcloud iam workload-identity-pools providers list \
      --project "$PROJECT" \
      --location global \
      --workload-identity-pool "$p" \
      --format 'value(name)' 2>/dev/null | sed -E 's#.*/providers/##' || true
  )
  for pr in "${PROVS[@]}"; do
    [[ -z "$pr" ]] && continue
    echo "    Deleting provider: $pr"
    safe gcloud iam workload-identity-pools providers delete "$pr" \
      --project "$PROJECT" --location global --workload-identity-pool "$p" --quiet
  done

  echo "  Deleting pool: $p"
  safe gcloud iam workload-identity-pools delete "$p" --project "$PROJECT" --location global --quiet
done

echo "6) IAM Service Accounts, delete ALL user-managed service accounts"
mapfile -t SERVICE_ACCOUNTS < <(
  gcloud iam service-accounts list \
    --project "$PROJECT" \
    --format 'value(email)' 2>/dev/null || true
)

for email in "${SERVICE_ACCOUNTS[@]}"; do
  [[ -z "$email" ]] && continue

  if is_google_managed_sa "$email"; then
    echo "  Skipping Google-managed/service-agent SA: $email"
    continue
  fi

  echo "  Deleting service account: $email"
  safe gcloud iam service-accounts delete "$email" --project "$PROJECT" --quiet
done

echo
echo "Done."
echo "Note: Google-managed service agents cannot be deleted, those were skipped."
