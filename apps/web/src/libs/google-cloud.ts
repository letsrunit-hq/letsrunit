import { CloudTasksClient } from '@google-cloud/tasks';
import { getVercelOidcToken } from '@vercel/oidc';
import { ExternalAccountClient } from 'google-auth-library';

const { GCP_PROJECT_ID, GCP_PROJECT_NUMBER, GCP_SERVICE_ACCOUNT_EMAIL, GCP_WIF_POOL_ID, GCP_WIF_PROVIDER_ID } =
  process.env;

export function getCloudTasksClient() {
  if (!GCP_WIF_POOL_ID) {
    return new CloudTasksClient({
      projectId: GCP_PROJECT_ID,
    });
  }

  const authClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WIF_POOL_ID}/providers/${GCP_WIF_PROVIDER_ID}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  });

  if (!authClient) {
    throw new Error('Failed to create ExternalAccountClient, check WIF config');
  }

  return new CloudTasksClient({
    projectId: GCP_PROJECT_ID,
    authClient,
  });
}
