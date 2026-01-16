#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"; : "${REGION:?Missing REGION}"

# Create the default queue or a specific one for runs
gcloud tasks queues create runs \
    --location="$REGION" \
    --max-concurrent-dispatches=10 \
    --max-dispatches-per-second=5 \
    --project "$PROJECT" || true
