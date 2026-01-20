# Worker

The worker is a service responsible for executing runs (scrapers, playwright flows, etc.) based on the tasks it receives.

## Purpose

The worker processes `Run` objects from the database. It supports three types of runs:
- **test**: Executes Gherkin-based Playwright tests.
- **explore**: Navigates through a website to discover features and pages.
- **generate**: Generates automation scripts or metadata for a given target.

## Environment Variables

The following environment variables are used by the worker and its shared packages:

### Supabase (Database & Auth)
- `SUPABASE_URL`: The URL of your Supabase project (e.g., `https://xyz.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for Supabase (required for bypass RLS).
- `ARTIFACT_BUCKET`: The name of the supabase bucket where screenshots and other artifacts are stored. Defaults to `artifacts`.

### Storage & Artifacts
- `GCP_PROJECT`: (Production) The Google Cloud project ID.
- `GCP_REGION`: (Production) The region where the service is deployed.

### Mailbox (Testing)
- `MAILBOX_SERVICE`: The mailbox service to use (`mailpit`, `mailhog`, or `testmail`). Defaults to `mailpit`.
- `TESTMAIL_API_KEY`: API key for testmail.app.
- `TESTMAIL_NAMESPACE`: Namespace for testmail.app.
- `MAILPIT_BASE_URL`: Base URL for Mailpit.
- `MAILHOG_BASE_URL`: Base URL for Mailhog.

### Server & Development
- `PORT`: The port on which the HTTP server listens. Defaults to `8080`.
- `TEST_SLEEP`: (Development) Artificial delay (ms) before processing a run in the listener.

## Development

In development, the worker uses Supabase Realtime to listen for new entries in the `runs` table with a `queued` status.

Run the development worker:
```bash
yarn workspace worker dev
```
This executes `src/listen.ts` using `tsx watch`.

## Production

In production, the worker runs as a stateless HTTP server (typically on Cloud Run) and is triggered by Google Cloud Tasks.

Run the production server:
```bash
yarn workspace worker start
```
This executes `src/server.ts`.

### Docker

The worker is packaged as a Docker image. See `apps/worker/Dockerfile` and `infra/scripts/04-deploy-worker.sh` for deployment details.
The server listens on `POST /tasks/run` and expects the `Run` object in the request body. OIDC authentication is used to secure the endpoint.
