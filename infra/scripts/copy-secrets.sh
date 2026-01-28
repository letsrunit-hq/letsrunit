#!/usr/bin/env bash
set -euo pipefail

# Usage: infra/scripts/copy-secrets.sh SOURCE_PROJECT TARGET_PROJECT

SOURCE_PROJECT="${1:-}"
TARGET_PROJECT="${2:-}"

if [[ -z "$SOURCE_PROJECT" || -z "$TARGET_PROJECT" ]]; then
  echo "Usage: $0 SOURCE_PROJECT TARGET_PROJECT"
  exit 1
fi

echo "Copying secrets from $SOURCE_PROJECT to $TARGET_PROJECT..."

# List all secrets in the source project
mapfile -t SECRETS < <(gcloud secrets list --project "$SOURCE_PROJECT" --format='value(name)' 2>/dev/null || true)

if [[ ${#SECRETS[@]} -eq 0 ]]; then
  echo "No secrets found in $SOURCE_PROJECT."
  exit 0
fi

for secret in "${SECRETS[@]}"; do
  [[ -z "$secret" ]] && continue

  echo "Processing secret: $secret"

  # Get the latest version value from source
  # We use --format='value(payload.data)' and decode it if necessary, but gcloud secrets versions access handles it
  SECRET_VALUE=$(gcloud secrets versions access latest --secret="$secret" --project="$SOURCE_PROJECT" 2>/dev/null || true)

  if [[ -z "$SECRET_VALUE" ]]; then
    echo "  Warning: Could not access latest version of $secret or it is empty. Skipping."
    continue
  fi

  # Ensure secret exists in target project
  if ! gcloud secrets describe "$secret" --project "$TARGET_PROJECT" >/dev/null 2>&1; then
    echo "  Creating secret $secret in $TARGET_PROJECT..."
    gcloud secrets create "$secret" --replication-policy="automatic" --project "$TARGET_PROJECT"
  else
    echo "  Secret $secret already exists in $TARGET_PROJECT."
  fi

  # Add the value as a new version in target project
  echo "  Adding version to $secret in $TARGET_PROJECT..."
  echo -n "$SECRET_VALUE" | gcloud secrets versions add "$secret" --data-file=- --project "$TARGET_PROJECT" >/dev/null

done

echo "Done."
