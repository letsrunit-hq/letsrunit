import { confirm, log, multiselect } from '@clack/prompts';
import type { Environment } from '../detect.js';
import { claudeStrategy } from './agents/claude.js';
import { codexStrategy } from './agents/codex.js';
import { copilotStrategy } from './agents/copilot.js';
import { cursorStrategy } from './agents/cursor.js';
import { geminiStrategy } from './agents/gemini.js';
import type { AgentId, AgentStrategy } from './agents/types.js';
import { AGENT_IDS } from './agents/types.js';
import { windsurfStrategy } from './agents/windsurf.js';

const STRATEGIES: AgentStrategy[] = [codexStrategy, cursorStrategy, claudeStrategy, copilotStrategy, geminiStrategy, windsurfStrategy];

function isAgentId(value: string): value is AgentId {
  return (AGENT_IDS as readonly string[]).includes(value);
}

export function parseAgents(value: string | undefined): AgentId[] {
  if (!value) return [];
  const ids = value
    .split(',')
    .map((agent) => agent.trim().toLowerCase())
    .filter(Boolean);

  const invalid = ids.filter((id) => !isAgentId(id));
  if (invalid.length > 0) {
    throw new Error(`Unknown agent(s): ${invalid.join(', ')}. Valid values: ${AGENT_IDS.join(', ')}`);
  }

  return [...new Set(ids)] as AgentId[];
}

function detectAgents(env: Pick<Environment, 'cwd'>): AgentStrategy[] {
  return STRATEGIES.filter((strategy) => strategy.detect(env));
}

async function resolveAgentStrategies(
  env: Pick<Environment, 'cwd' | 'isInteractive'>,
  options: { agents?: AgentId[]; yes?: boolean },
): Promise<AgentStrategy[]> {
  if (options.agents && options.agents.length > 0) {
    return STRATEGIES.filter((strategy) => options.agents?.includes(strategy.id));
  }

  if (!env.isInteractive || options.yes) {
    log.info('Skipping AI agent setup: no --agents provided in non-interactive mode or with --yes.');
    return [];
  }

  const detected = detectAgents(env);
  if (detected.length === 0) {
    const selected = await multiselect({
      message: 'Which AI agent(s) should be configured for letsrunit MCP + skill?',
      options: STRATEGIES.map((strategy) => ({ value: strategy.id, label: strategy.label })),
      required: false,
    });
    if (!selected || selected.length === 0) return [];
    return STRATEGIES.filter((strategy) => (selected as AgentId[]).includes(strategy.id));
  }

  if (detected.length === 1) {
    const strategy = detected[0];
    const proceed = await confirm({ message: `Detected ${strategy.label}. Configure letsrunit for it?`, initialValue: true });
    return proceed === true ? [strategy] : [];
  }

  const selected = await multiselect({
    message: 'Multiple AI agents detected. Select which agent(s) to configure:',
    options: detected.map((strategy) => ({ value: strategy.id, label: strategy.label, hint: strategy.id })),
    required: false,
  });

  if (!selected || selected.length === 0) return [];
  return detected.filter((strategy) => (selected as AgentId[]).includes(strategy.id));
}

export async function setupAgents(
  env: Pick<Environment, 'cwd' | 'isInteractive'>,
  options: { agents?: AgentId[]; yes?: boolean; noMcp?: boolean },
): Promise<void> {
  if (options.noMcp) {
    log.info('Skipped AI agent setup because MCP installation is disabled (--no-mcp).');
    return;
  }

  const strategies = await resolveAgentStrategies(env, options);
  for (const strategy of strategies) {
    const changedMcp = strategy.configureMcp(env);
    const changedSkill = strategy.installSkill(env);
    if (changedMcp === 'skipped') log.info(`${strategy.label}: MCP config already up to date.`);
    else log.success(`${strategy.label}: MCP config ${changedMcp}.`);

    if (changedSkill === 'skipped') log.info(`${strategy.label}: skill already installed or unavailable.`);
    else log.success(`${strategy.label}: skill installed.`);
  }
}
