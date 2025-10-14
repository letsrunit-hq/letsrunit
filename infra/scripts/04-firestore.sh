#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"

gcloud firestore databases create --region="$REGION" --project "$PROJECT" || true

# optional: apply composite indexes if you add any
if [ -f firestore/indexes.json ] && [ -s firestore/indexes.json ]; then
  echo "Indexes file present (placeholder). Configure as needed."
fi
