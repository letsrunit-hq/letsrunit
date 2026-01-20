#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudtasks.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  iamcredentials.googleapis.com \
  --project "$PROJECT"
