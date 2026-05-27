import { isCancel, log, note, text } from '@clack/prompts';
import { writeLetsrunitEnv } from '../setup/cli-ai.js';
import type { InitContext } from './context.js';

const BASE_URL_EXPLANATION = [
  'The base URL is the address letsrunit opens when a feature says to visit your app.',
  'Init stores it as LETSRUNIT_BASE_URL in .letsrunit/.env so Cucumber, the CLI, MCP, and CI use the same runtime setting.',
].join('\n');

type BaseUrlContext = Pick<InitContext, 'env' | 'appTarget' | 'baseUrl'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

async function selectBaseUrl(context: BaseUrlContext): Promise<string> {
  const detected = context.appTarget.value.baseUrl;
  if (!context.env.isInteractive) return detected;

  note(BASE_URL_EXPLANATION, 'Base URL');
  const value = assertNotCanceled(await text({ message: 'Base URL for letsrunit tests', initialValue: detected }));
  return value.trim() || detected;
}

function writeBaseUrl(context: BaseUrlContext, baseUrl: string): void {
  const result = writeLetsrunitEnv(context.env.cwd, { LETSRUNIT_BASE_URL: baseUrl });
  if (result === 'skipped') log.info('.letsrunit/.env already up to date');
  else log.success(`.letsrunit/.env ${result}`);
}

export async function setupBaseUrl(context: BaseUrlContext): Promise<void> {
  const baseUrl = await selectBaseUrl(context);
  writeBaseUrl(context, baseUrl);
  context.baseUrl = baseUrl;
}
