#!/usr/bin/env bash
set -uo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

: "${PROJECT:?Missing PROJECT}"
: "${REGION:?Missing REGION}"

# Optional/Required for specific checks
VERCEL_TEAM_SLUG="${VERCEL_TEAM_SLUG:-}"
VERCEL_PROJECT_NAME="${VERCEL_PROJECT_NAME:-}"
VERCEL_ENV="${VERCEL_ENV:-}"
REPO="${REPO:-}" # GitHub repo owner/name

FAILED=0

echo -e "${YELLOW}Verifying infrastructure for PROJECT=${PROJECT}, REGION=${REGION}${NC}\n"

check() {
    local label="$1"
    shift
    echo -n "Checking $label... "
    if "$@" >/dev/null 2>&1; then
        echo -e "${GREEN}[OK]${NC}"
        return 0
    else
        echo -e "${RED}[FAIL]${NC}"
        FAILED=1
        return 1
    fi
}

# 00-enable-apis.sh
echo "00) APIs"
APIS=(
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
    "cloudtasks.googleapis.com"
    "secretmanager.googleapis.com"
    "cloudbuild.googleapis.com"
    "logging.googleapis.com"
    "monitoring.googleapis.com"
    "iamcredentials.googleapis.com"
    "iam.googleapis.com"
)
for api in "${APIS[@]}"; do
    check "API $api" bash -c "gcloud services list --enabled --filter='config.name=$api' --project '$PROJECT' --format='value(config.name)' --quiet | grep -q '$api'"
done
echo

# 01-secrets.sh
echo "01) Secrets"
SECRETS=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "TESTMAIL_API_KEY"
    "LANGSMITH_ENDPOINT"
    "LANGSMITH_API_KEY"
    "OPENAI_API_KEY"
)
for secret in "${SECRETS[@]}"; do
    check "Secret $secret" gcloud secrets describe "$secret" --project "$PROJECT" --quiet
done
echo

# 02-artifact-registry.sh
echo "02) Artifact Registry"
REPO_NAME="${REPO_NAME:-letsrunit}"
check "Repo $REPO_NAME" gcloud artifacts repositories describe "$REPO_NAME" --project "$PROJECT" --location "$REGION" --quiet
echo

# 03-cloud-tasks.sh
echo "03) Cloud Tasks"
QUEUE_NAME="${QUEUE_NAME:-runs}"
check "Queue $QUEUE_NAME" gcloud tasks queues describe "$QUEUE_NAME" --project "$PROJECT" --location "$REGION" --quiet
echo

# 04-worker-iam.sh
echo "04) Worker IAM"
WORKER_RUNTIME_SA_NAME="${WORKER_RUNTIME_SA_NAME:-worker-runtime-sa}"
WORKER_RUNTIME_SA_EMAIL="${WORKER_RUNTIME_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
check "SA $WORKER_RUNTIME_SA_NAME" gcloud iam service-accounts describe "$WORKER_RUNTIME_SA_EMAIL" --project "$PROJECT" --quiet

for secret in "${SECRETS[@]}"; do
    check "SA Access to secret $secret" bash -c "gcloud secrets get-iam-policy '$secret' --project '$PROJECT' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/secretmanager.secretAccessor\") | .members[]' | grep -q 'serviceAccount:$WORKER_RUNTIME_SA_EMAIL'"
done

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)' --quiet)"
RUN_AGENT="service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com"
check "Cloud Run agent repo reader" bash -c "gcloud artifacts repositories get-iam-policy '$REPO_NAME' --project '$PROJECT' --location '$REGION' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/artifactregistry.reader\") | .members[]' | grep -q 'serviceAccount:$RUN_AGENT'"
echo

# 05-vercel-wif.sh
if [[ -n "$VERCEL_TEAM_SLUG" && -n "$VERCEL_PROJECT_NAME" && -n "$VERCEL_ENV" ]]; then
    echo "05) Vercel WIF"
    WEB_SA_NAME="${WEB_SA_NAME:-web-sa}"
    WEB_SA_EMAIL="${WEB_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
    POOL_ID="${POOL_ID:-vercel}"
    PROVIDER_ID="${PROVIDER_ID:-vercel}"

    check "SA $WEB_SA_NAME" gcloud iam service-accounts describe "$WEB_SA_EMAIL" --project "$PROJECT" --quiet
    check "Queue Enqueuer binding" bash -c "gcloud tasks queues get-iam-policy '$QUEUE_NAME' --project '$PROJECT' --location '$REGION' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/cloudtasks.enqueuer\") | .members[]' | grep -q 'serviceAccount:$WEB_SA_EMAIL'"
    check "WIF Pool $POOL_ID" gcloud iam workload-identity-pools describe "$POOL_ID" --project "$PROJECT" --location "global" --quiet
    check "WIF Pool $POOL_ID is ACTIVE" bash -c "gcloud iam workload-identity-pools describe '$POOL_ID' --project '$PROJECT' --location 'global' --format='value(state)' --quiet | grep -q '^ACTIVE$'"
    check "WIF Provider $PROVIDER_ID" gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" --project "$PROJECT" --location "global" --workload-identity-pool "$POOL_ID" --quiet

    SUBJECT="owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:${VERCEL_ENV}"
    PRINCIPAL="principal://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/subject/${SUBJECT}"
    check "WIF Impersonation binding" bash -c "gcloud iam service-accounts get-iam-policy '$WEB_SA_EMAIL' --project '$PROJECT' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/iam.workloadIdentityUser\") | .members[]' | grep -q '$PRINCIPAL'"
    echo
else
    echo -e "05) Vercel WIF ${YELLOW}(Skipped: VERCEL_TEAM_SLUG, VERCEL_PROJECT_NAME, or VERCEL_ENV not set)${NC}\n"
fi

# 06-deploy-worker.sh
echo "06) Deploy Worker"
check "Cloud Run service worker" gcloud run services describe worker --project "$PROJECT" --region "$REGION" --quiet
echo

# 07-worker-invoker-binding.sh
echo "07) Worker Invoker Binding"
TASKS_INVOKER_SA_NAME="${TASKS_INVOKER_SA_NAME:-tasks-invoker-sa}"
TASKS_INVOKER_SA_EMAIL="${TASKS_INVOKER_SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
check "SA $TASKS_INVOKER_SA_NAME" gcloud iam service-accounts describe "$TASKS_INVOKER_SA_EMAIL" --project "$PROJECT" --quiet
check "Worker Invoker binding" bash -c "gcloud run services get-iam-policy worker --project '$PROJECT' --region '$REGION' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/run.invoker\") | .members[]' | grep -q 'serviceAccount:$TASKS_INVOKER_SA_EMAIL'"
echo

# 08-github-wif.sh
if [[ -n "$REPO" ]]; then
    echo "08) GitHub WIF"
    GITHUB_SA_EMAIL="github-actions-sa@${PROJECT}.iam.gserviceaccount.com"
    check "SA github-actions-sa" gcloud iam service-accounts describe "$GITHUB_SA_EMAIL" --project "$PROJECT" --quiet
    check "WIF Pool github-pool" gcloud iam workload-identity-pools describe "github-pool" --project "$PROJECT" --location "global" --quiet
    check "WIF Pool github-pool is ACTIVE" bash -c "gcloud iam workload-identity-pools describe 'github-pool' --project '$PROJECT' --location 'global' --format='value(state)' --quiet | grep -q '^ACTIVE$'"
    check "WIF Provider github-provider" gcloud iam workload-identity-pools providers describe "github-provider" --project "$PROJECT" --location "global" --workload-identity-pool "github-pool" --quiet

    PRINCIPAL_REPO="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
    check "WIF Impersonation binding" bash -c "gcloud iam service-accounts get-iam-policy '$GITHUB_SA_EMAIL' --project '$PROJECT' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/iam.workloadIdentityUser\") | .members[]' | grep -q '$PRINCIPAL_REPO'"

    # Roles checks (partial)
    check "Role roles/run.admin" bash -c "gcloud projects get-iam-policy '$PROJECT' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/run.admin\") | .members[]' | grep -q \"serviceAccount:$GITHUB_SA_EMAIL\""
    check "Role roles/iam.serviceAccountUser" bash -c "gcloud projects get-iam-policy '$PROJECT' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/iam.serviceAccountUser\") | .members[]' | grep -q \"serviceAccount:$GITHUB_SA_EMAIL\""
    check "Role roles/artifactregistry.admin" bash -c "gcloud projects get-iam-policy '$PROJECT' --format=json --quiet | jq -e '.bindings[] | select(.role == \"roles/artifactregistry.admin\") | .members[]' | grep -q \"serviceAccount:$GITHUB_SA_EMAIL\""
    echo
else
    echo -e "10) GitHub WIF ${YELLOW}(Skipped: REPO [owner/repo] not set)${NC}\n"
fi

echo -e "${YELLOW}Verification complete.${NC}"

exit "$FAILED"
