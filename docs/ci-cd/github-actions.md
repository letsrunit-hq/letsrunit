---
description: Run your feature files on every push with GitHub Actions.
---

# GitHub Actions

The workflow itself is straightforward. The part that requires actual thought is getting your app running inside GitHub Actions so Playwright can reach it.

`npx letsrunit init` scaffolds a workflow file with `npm start` as a starting point. In most cases you'll need to adapt it: the app needs a database, environment variables, a build step, or all of the above. The patterns below cover the most common setups.

### Base workflow

```yaml
name: Features
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  features:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      - name: Start app
        run: npm start &
      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 30000
      - name: Run features
        run: npx cucumber-js
```

The `&` runs the server in the background. `wait-on` blocks until the URL responds, so Playwright doesn't start before the app is ready. Adjust the port to match your app and the start command to match your package manager.

{% hint style="info" %}
Your `baseURL` in `cucumber.js` must point to wherever the app is running: `http://localhost:3000` for a local dev server, or a staging URL if you deploy first.
{% endhint %}

### With Mailpit

If your tests use email steps, add Mailpit as a service container and configure your app to send mail via `localhost:1025`:

```yaml
services:
  mailpit:
    image: axllent/mailpit
    ports:
      - 8025:8025
      - 1025:1025
```

Set the letsrunit environment variable alongside your app:

```yaml
      - name: Run features
        run: npx cucumber-js
        env:
          MAILBOX_SERVICE: mailpit
```

### App with a database

Add a service container for the database and run migrations before starting the app:

```yaml
jobs:
  features:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: myapp_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/myapp_test
      - name: Start app
        run: npm start &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/myapp_test
      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 30000
      - name: Run features
        run: npx cucumber-js
```

### Supabase

**Option 1: Run Supabase locally in CI**

If you use Supabase locally in development, you can do the same in CI. This starts the full Supabase stack in Docker and applies your migrations:

```yaml
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Start Supabase
        run: supabase start
      - name: Apply migrations
        run: supabase db push
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      - name: Start app
        run: npm start &
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ steps.supabase.outputs.anon_key }}
      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 60000
      - name: Run features
        run: npx cucumber-js
```

This is self-contained but slow. Supabase takes time to start. Budget an extra minute or two.

**Option 2: Supabase branch databases**

If you use Supabase branching, each pull request gets its own database automatically. Retrieve the branch credentials in the workflow and pass them to your app:

```yaml
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Get branch database URL
        id: db
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          echo "url=$(supabase db url --db-url)" >> $GITHUB_OUTPUT
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      # ... install, build steps ...
      - name: Start app
        run: npm start &
        env:
          DATABASE_URL: ${{ steps.db.outputs.url }}
      - name: Wait for app
        run: npx wait-on http://localhost:3000 --timeout 30000
      - name: Run features
        run: npx cucumber-js
```

Add `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` to your repository secrets.

**Option 3: Shared staging database**

The simplest option if branch isolation isn't a requirement: point your app at a shared staging Supabase project via secrets. No local startup needed for the database.

### Using a staging URL

If you deploy to a staging environment before running tests, skip the local server entirely:

```yaml
      - name: Run features
        run: npx cucumber-js
        env:
          BASE_URL: https://staging.yourapp.com
```

And in `cucumber.js`:

```js
export default {
  timeout: 30_000,
  worldParameters: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
};
```

This is reliable but means your tests run against a deployment rather than the branch code directly. Works well if you have a preview deployment per pull request (Vercel, Netlify, Render, etc.).

<details>
<summary>Using yarn, pnpm, or bun</summary>

Replace the setup and install steps with the appropriate commands for your package manager.

**yarn:**
```yaml
      - name: Enable Corepack
        run: corepack enable
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: yarn
      - name: Install dependencies
        run: yarn install --immutable
```

**pnpm:**
```yaml
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

**bun:**
```yaml
      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile
```

</details>
