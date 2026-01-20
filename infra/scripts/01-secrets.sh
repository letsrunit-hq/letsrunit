#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT:?Missing PROJECT}"

# ---- required env vars ----
: "${SUPABASE_URL:?Missing SUPABASE_URL}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Missing SUPABASE_SERVICE_ROLE_KEY}"
: "${TESTMAIL_API_KEY:?Missing TESTMAIL_API_KEY}"
: "${LANGSMITH_ENDPOINT:?Missing LANGSMITH_ENDPOINT}"
: "${LANGSMITH_API_KEY:?Missing LANGSMITH_API_KEY}"
: "${OPENAI_API_KEY:?Missing OPENAI_API_KEY}"

create_secret() {
  local name=$1
  local value=$2

  if ! gcloud secrets describe "$name" --project "$PROJECT" >/dev/null 2>&1; then
    echo "Creating secret: $name"
    gcloud secrets create "$name" --replication-policy="automatic" --project "$PROJECT"
  fi

  echo "Setting value for secret: $name"
  echo -n "$value" | gcloud secrets versions add "$name" --data-file=- --project "$PROJECT"
}

create_secret "SUPABASE_URL" "$SUPABASE_URL"
create_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
create_secret "TESTMAIL_API_KEY" "$TESTMAIL_API_KEY"
create_secret "LANGSMITH_ENDPOINT" "$LANGSMITH_ENDPOINT"
create_secret "LANGSMITH_API_KEY" "$LANGSMITH_API_KEY"
create_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
