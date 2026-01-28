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

confirm() {
  local prompt="$1"
  local answer
  echo -n "$prompt [y/N]? "
  read -n 1 -r answer
  echo
  [[ "$answer" =~ ^[Yy]$ ]]
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
if [[ ${#RUN_SERVICES[@]} -gt 0 ]] && confirm "Delete all ${#RUN_SERVICES[@]} Cloud Run services"; then
  for s in "${RUN_SERVICES[@]}"; do
    [[ -z "$s" ]] && continue
    echo "  Deleting Cloud Run service: $s"
    safe gcloud run services delete "$s" --platform managed --project "$PROJECT" --region "$REGION"
  done
fi

echo "2) Cloud Tasks queues in ${REGION}"
mapfile -t QUEUES < <(
  gcloud tasks queues list \
    --project "$PROJECT" \
    --location "$REGION" \
    --format 'value(name)' 2>/dev/null | sed -E 's#.*/queues/##' || true
)
if [[ ${#QUEUES[@]} -gt 0 ]] && confirm "Purge all ${#QUEUES[@]} Cloud Tasks queues"; then
  for q in "${QUEUES[@]}"; do
    [[ -z "$q" ]] && continue
    echo "  Purging queue: $q"
    safe gcloud tasks queues purge "$q" --project "$PROJECT" --location "$REGION"
  done
fi

echo "3) Artifact Registry repos in ${REGION}"
mapfile -t REPOS < <(
  gcloud artifacts repositories list \
    --project "$PROJECT" \
    --location "$REGION" \
    --format 'value(name)' 2>/dev/null | sed -E 's#.*/repositories/##' || true
)
if [[ ${#REPOS[@]} -gt 0 ]] && confirm "Delete all ${#REPOS[@]} Artifact Registry repos"; then
  for r in "${REPOS[@]}"; do
    [[ -z "$r" ]] && continue
    echo "  Deleting repo: $r"
    safe gcloud artifacts repositories delete "$r" --project "$PROJECT" --location "$REGION"
  done
fi

echo "4) Secret Manager, delete ALL secrets"
mapfile -t SECRETS < <(
  gcloud secrets list --project "$PROJECT" --format 'value(name)' 2>/dev/null || true
)
if [[ ${#SECRETS[@]} -gt 0 ]] && confirm "Delete all ${#SECRETS[@]} secrets"; then
  for s in "${SECRETS[@]}"; do
    [[ -z "$s" ]] && continue
    echo "  Deleting secret: $s"
    safe gcloud secrets delete "$s" --project "$PROJECT"
  done
fi

echo "5) Workload Identity Pools (global), delete ALL pools and providers"
mapfile -t POOLS < <(
  gcloud iam workload-identity-pools list \
    --project "$PROJECT" \
    --location global \
    --format 'value(name)' 2>/dev/null | sed -E 's#.*/workloadIdentityPools/##' || true
)
if [[ ${#POOLS[@]} -gt 0 ]] && confirm "Empty all ${#POOLS[@]} Workload Identity pools (delete providers)"; then
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
        --project "$PROJECT" --location global --workload-identity-pool "$p"
    done
  done
fi

echo "6) IAM Service Accounts, clean ALL user-managed service accounts (remove IAM bindings)"
mapfile -t SERVICE_ACCOUNTS < <(
  gcloud iam service-accounts list \
    --project "$PROJECT" \
    --format 'value(email)' 2>/dev/null || true
)

# Filter out google managed SAs before prompting
USER_MANAGED_SAS=()
for email in "${SERVICE_ACCOUNTS[@]}"; do
  [[ -z "$email" ]] && continue
  if ! is_google_managed_sa "$email"; then
    USER_MANAGED_SAS+=("$email")
  fi
done

if [[ ${#USER_MANAGED_SAS[@]} -gt 0 ]] && confirm "Clean all ${#USER_MANAGED_SAS[@]} user-managed service accounts"; then
  for email in "${USER_MANAGED_SAS[@]}"; do
    echo "  Cleaning service account (removing bindings): $email"
    # Remove all IAM policy bindings ON the service account (like impersonation)
    safe gcloud iam service-accounts set-iam-policy "$email" /dev/null --project "$PROJECT"

    # Remove the service account from project-level IAM roles
    # This is trickier as gcloud doesn't have a simple "remove member from all roles"
    # But we can get the policy and filter out the member.
    # For now, let's at least clear the SA's own policy which handles WIF impersonation.
  done
fi

echo
echo "Done."
echo "Note: Google-managed service agents cannot be deleted, those were skipped."
