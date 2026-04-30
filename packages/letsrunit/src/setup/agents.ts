import { log } from '@clack/prompts';
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

export function getAgentCatalog(): Array<{ id: AgentId; label: string }> {
  return STRATEGIES.map((strategy) => ({ id: strategy.id, label: strategy.label }));
}

export function detectAgentIds(env: Pick<Environment, 'cwd'>): AgentId[] {
  return STRATEGIES.filter((strategy) => strategy.detect(env)).map((strategy) => strategy.id);
}

function resolveStrategies(ids: AgentId[]): AgentStrategy[] {
  return STRATEGIES.filter((strategy) => ids.includes(strategy.id));
}

export async function setupAgents(
  env: Pick<Environment, 'cwd'>,
  options: { agents?: AgentId[]; noMcp?: boolean },
): Promise<void> {
  if (options.noMcp) {
    log.info('Skipped AI agent setup because MCP installation is disabled (--no-mcp).');
    return;
  }

  const agentIds = options.agents ?? [];
  if (agentIds.length === 0) {
    log.info('Skipped AI agent setup.');
    return;
  }

  const strategies = resolveStrategies(agentIds);
  for (const strategy of strategies) {
    const changedMcp = strategy.configureMcp(env);
    const changedSkill = strategy.installSkill(env);
    if (changedMcp === 'skipped') log.info(`${strategy.label}: MCP config already up to date.`);
    else log.success(`${strategy.label}: MCP config ${changedMcp}.`);

    if (changedSkill === 'skipped') log.info(`${strategy.label}: skill already installed or unavailable.`);
    else log.success(`${strategy.label}: skill installed.`);
  }
}
