#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?}"; : "${REGION:?}"

gcloud services enable   run.googleapis.com   artifactregistry.googleapis.com   pubsub.googleapis.com   firestore.googleapis.com   secretmanager.googleapis.com   cloudbuild.googleapis.com   logging.googleapis.com   monitoring.googleapis.com   iamcredentials.googleapis.com   --project "$PROJECT"
