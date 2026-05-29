import type { AgentId } from '../setup/agents/types.js';
import type { Environment } from '../detect.js';
import type { InitOptions } from '../init-options.js';
import type { AiProvider, ModelTier } from '../setup/cli-ai.js';
import type { CiMailConfig } from '../setup/ci-workflow-plan.js';
import type { AppTarget, DetectionResult } from '../setup/project-app.js';

export interface CliAiConfig {
  provider: AiProvider;
  models: Record<ModelTier, string>;
  apiKey?: string;
}

export interface MailSetup {
  config: CiMailConfig;
  env: Record<string, string | undefined>;
}

export interface InitContext {
  env: Environment;
  options: InitOptions;
  detectedAgents: AgentId[];
  appTarget: DetectionResult<AppTarget>;
  baseUrl?: string;
  mailSetup?: MailSetup;
}
