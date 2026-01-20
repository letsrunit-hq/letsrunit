#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

QUEUE_NAME="${QUEUE_NAME:-runs}"

# Create the default queue or a specific one for runs
gcloud tasks queues create "$QUEUE_NAME" \
    --location="$REGION" \
    --max-concurrent-dispatches=10 \
    --max-dispatches-per-second=5 \
    --project "$PROJECT" || true
