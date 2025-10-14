# 🧪 LetsRunIt

AI-assisted website testing with Playwright — built for real-world production automation.

This monorepo contains the full LetsRunIt stack:
- a **Next.js web app** for UI and API access
- a **Playwright sandbox runner** (Cloud Run Job)
- a **worker service** that orchestrates jobs via Pub/Sub
- a set of **shared packages** for logic, orchestration, and schema validation

---

## 🏗️ Architecture Overview

```txt
apps/
├─ web/        → Next.js frontend + API routes
│                • In dev: runs Playwright directly for debugging
│                • In prod: publishes jobs to Pub/Sub
│
├─ worker/     → Cloud Run service (Pub/Sub push subscription)
│                • Receives job messages
│                • Starts Cloud Run Job (runner) via API
│
└─ runner/     → Cloud Run Job container
                 • Executes Playwright inside an isolated sandbox
                 • Uploads artifacts (screenshots, traces) to Cloud Storage

packages/
├─ core/                 → types, zod schemas, shared utils
├─ controller/           → all Playwright flows & heuristics
└─ executor/             → shared browser orchestration logic
````

---

## ⚙️ Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| UI & API      | Next.js (React 19, TypeScript)     |
| Automation    | Playwright v1.47+                  |
| Cloud Runtime | Google Cloud Run (services + jobs) |
| Messaging     | Google Pub/Sub                     |
| Storage       | Google Cloud Storage               |
| Database      | Firestore (Native mode)            |
| Dev tooling   | Yarn v4, TypeScript, Vitest        |

---

## 💻 Local Development

In development, you can skip Pub/Sub and Cloud Run entirely.
The `web` app can execute Playwright **directly** for rapid debugging.

### 1. Install dependencies

```bash
yarn install
```

### 2. Run Next.js in dev mode

```bash
yarn workspace web dev
```

### 3. Enable direct local Playwright execution

Add this to `apps/web/.env.local`:

```
DEV_DIRECT_RUN=1
```

Then POST to:

```
POST http://localhost:3000/api/jobs
{
  "runId": "local-test",
  "url": "https://example.com"
}
```

Artifacts will be saved locally under:

```
apps/web/tmp/runs/<runId>/artifacts/
```

---

## ☁️ Production Deployment (GCP)

In production, LetsRunIt runs fully sandboxed on Google Cloud:

| Component | GCP Resource      | Notes                                  |
| --------- | ----------------- | -------------------------------------- |
| Web       | Cloud Run Service | Public Next.js frontend                |
| Worker    | Cloud Run Service | Pub/Sub push endpoint                  |
| Runner    | Cloud Run Job     | Isolated Playwright sandbox            |
| Messaging | Pub/Sub           | Topic `runs`, subscription `runs-push` |
| Storage   | Cloud Storage     | Stores screenshots, traces             |
| Database  | Firestore         | Job metadata and results               |

All infrastructure templates and scripts are under [`infra/`](infra/).

To bootstrap GCP:

```bash
cd infra
./scripts/00-enable-apis.sh
./scripts/01-iam-service-accounts.sh
./scripts/02-pubsub.sh
./scripts/03-storage.sh
./scripts/04-firestore.sh
```

Deploy:

```bash
./scripts/10-deploy-app.sh
./scripts/11-deploy-worker.sh
./scripts/12-build-deploy-runner.sh
```

---

## 🧩 Packages

| Package                                        | Purpose                                      |
| ---------------------------------------------- | -------------------------------------------- |
| [`@letsrunit/core`](packages/core)             | Shared types, Zod schemas, logger            |
| [`@letsrunit/controller`](packages/controller) | Pure Playwright flow logic                   |
| [`@letsrunit/executor`](packages/executor)     | Common orchestration of browser/context/page |

These packages are used by both the **web** (for local dev) and **runner** (for production execution), ensuring zero duplicated Playwright logic.

---

## 🧠 Dev Tips

* Run any workspace command directly:

  ```bash
  yarn workspace web dev
  yarn workspace worker dev
  yarn workspace runner build
  ```

* Add a new shared package:

  ```bash
  mkdir packages/<name> && cd packages/<name>
  yarn init -y
  ```

* Lint or typecheck across all:

  ```bash
  yarn workspaces foreach -pt run typecheck
  ```

---

## 🧰 Requirements

* Node 20+
* Yarn v4+
* Google Cloud SDK (for deployment)
* Playwright browsers installed:

  ```bash
  npx playwright install
  ```
