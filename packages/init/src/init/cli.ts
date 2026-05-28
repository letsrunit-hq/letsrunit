import { confirm, isCancel, log, note, password, select, spinner } from '@clack/prompts';
import { hasExplicitInitSelections } from '../init-options.js';
import { installCli, isCliInstalled } from '../setup/cli.js';
import {
  formatManualCliAiSetupInstructions,
  type AiProvider,
  type ModelTier,
  providerPreset,
  PROVIDER_PRESETS,
  writeLetsrunitEnv,
} from '../setup/cli-ai.js';
import type { CliAiConfig, InitContext } from './context.js';

const CLI_EXPLANATION = [
  'The letsrunit CLI provides terminal commands for generating tests and explaining tests failures. It requires an AI API key to work.',
  "Install it if you're not using an AI coding agent (such as Claude or Codex), but want to use AI to generate and debug tests from the terminal.",
].join('\n');

type CliContext = Pick<InitContext, 'env' | 'options'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

async function shouldSetupCli(context: CliContext): Promise<boolean> {
  if (isCliInstalled(context.env)) {
    log.success('@letsrunit/cli already installed');
    return false;
  }

  if (hasExplicitInitSelections(context.options)) return Boolean(context.options.withCli);

  note(CLI_EXPLANATION, 'CLI');
  return assertNotCanceled(await confirm({ message: 'Install the letsrunit CLI?', initialValue: false }));
}

async function selectModel(provider: AiProvider, tier: ModelTier): Promise<string> {
  const preset = providerPreset(provider);
  return assertNotCanceled(
    await select({
      message: `Choose ${tier} model`,
      options: preset.models[tier].map((model) => ({ value: model, label: model })),
      initialValue: preset.defaults[tier],
    }),
  );
}

async function selectCliAiConfig(): Promise<CliAiConfig | null> {
  const configure = assertNotCanceled(
    await confirm({ message: 'Configure CLI AI provider and models now?', initialValue: true }),
  );
  if (!configure) {
    return null;
  }

  const provider = assertNotCanceled(
    await select({
      message: 'Choose AI provider',
      options: PROVIDER_PRESETS.map((preset) => ({ value: preset.provider, label: preset.label })),
      initialValue: 'openai' as AiProvider,
    }),
  );
  const preset = providerPreset(provider);
  const large = await selectModel(provider, 'large');
  const medium = await selectModel(provider, 'medium');
  const small = await selectModel(provider, 'small');
  const apiKey = assertNotCanceled(
    await password({
      message: `${preset.keyName} (optional, leave blank to set manually)`,
      mask: '*',
    }),
  ).trim();

  return {
    provider,
    models: { large, medium, small },
    ...(apiKey ? { apiKey } : {}),
  };
}

async function applyCliInstall(context: CliContext): Promise<void> {
  const env = context.env;

  const s = spinner();
  s.start('Installing @letsrunit/cli…');
  installCli(env);
  s.stop('@letsrunit/cli installed');
}

function applyCliAiConfig(context: CliContext, config: CliAiConfig): void {
  const preset = providerPreset(config.provider);
  const result = writeLetsrunitEnv(context.env.cwd, {
    LETSRUNIT_AI_PROVIDER: config.provider,
    LETSRUNIT_MODEL_LARGE: config.models.large,
    LETSRUNIT_MODEL_MEDIUM: config.models.medium,
    LETSRUNIT_MODEL_SMALL: config.models.small,
    [preset.keyName]: config.apiKey,
  });

  if (result === 'skipped') log.info('.letsrunit/.env already up to date');
  else log.success(`.letsrunit/.env ${result}`);
}

function showManualCliAiSetup(): void {
  note(formatManualCliAiSetupInstructions(), 'Manual CLI AI setup');
}

export async function setupCli(context: CliContext): Promise<void> {
  const requested = await shouldSetupCli(context);
  if (!requested) return;

  await applyCliInstall(context);

  const explicit = hasExplicitInitSelections(context.options);
  const config = context.env.isInteractive && !explicit ? await selectCliAiConfig() : null;
  if (config) applyCliAiConfig(context, config);
  else showManualCliAiSetup();
}
