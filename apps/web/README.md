This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

The following environment variables are required for the application to function correctly. You can create a `.env.local` file in the `apps/web` directory for local development.

### Supabase (Public)

These variables are required for authentication and database access via Supabase.

* `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project (defaults to `http://127.0.0.1:54321` for local development).
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.

### Cloud Tasks (Server-side only)

These variables are used to queue runs in Google Cloud Tasks. These are required for production.

* `GCP_PROJECT_ID`: Your Google Cloud project ID.
* `GCP_REGION`: The region where your Cloud Tasks queue is located.
* `GCP_QUEUE_NAME`: The name of the Cloud Tasks queue (e.g., `runs`).
* `GCP_WORKER_URL`: The base URL of the worker service (e.g., `https://worker-xxxxx.a.run.app`).
  * You can find this URL using the gcloud CLI:
    ```bash
    gcloud run services describe worker --platform managed --region <GCP_REGION> --format 'value(status.url)'
    ```

### Google Cloud Workload Identity Federation (WIF)

If you are deploying to Vercel and want to use WIF to authenticate with Google Cloud, you need to set the following environment variables:

* `GCP_PROJECT_NUMBER`: Your Google Cloud project number.
* `GCP_SERVICE_ACCOUNT_EMAIL`: The email of the service account to impersonate.
* `GCP_WIF_POOL_ID`: The ID of the Workload Identity Pool.
* `GCP_WIF_PROVIDER_ID`: The ID of the Workload Identity Provider.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
