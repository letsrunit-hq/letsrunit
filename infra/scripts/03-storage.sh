#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"; : "${BUCKET:?}"

gsutil mb -p "$PROJECT" -l "$REGION" -b on "gs://${BUCKET}" || true
gsutil lifecycle set storage/lifecycle.json "gs://${BUCKET}"
