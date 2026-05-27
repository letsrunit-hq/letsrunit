import { isCancel, log, multiselect, note, spinner } from '@clack/prompts';
import { hasExplicitInitSelections } from '../init-options.js';
import { getAgentCatalog, parseAgents, setupAgents } from '../setup/agents.js';
import type { AgentId } from '../setup/agents/types.js';
import { installMcpServer, isMcpServerInstalled } from '../setup/mcp.js';
import type { InitContext } from './context.js';

const AGENTS_EXPLANATION = [
  'Agent integration configures MCP so AI coding agents can inspect your project, load your support files, and run letsrunit steps.',
  'Use this if you want tools such as Codex, Cursor, Claude Code, Copilot, Gemini, or Windsurf to drive tests from the project.',
].join('\n');

type AgentsContext = Pick<InitContext, 'env' | 'options' | 'detectedAgents'>;

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) throw new Error('Initialization canceled.');
  return value;
}

function explicitAgents(context: AgentsContext): AgentId[] {
  const agentValue = Array.isArray(context.options.agents) ? context.options.agents.join(',') : context.options.agents;
  return parseAgents(agentValue);
}

async function selectAgents(context: AgentsContext): Promise<AgentId[]> {
  note(AGENTS_EXPLANATION, 'AI agents');
  note('Use ↑/↓ to move, space to toggle, enter to continue.', 'Agent Controls');
  const selectedAgents = assertNotCanceled(
    await multiselect({
      message: 'Configure AI agents (MCP package + per-agent setup)',
      options: getAgentCatalog().map((agent) => ({
        value: agent.id,
        label: agent.label,
        hint: context.detectedAgents.includes(agent.id) ? 'detected' : undefined,
      })),
      initialValues: context.detectedAgents,
      required: false,
    }),
  ) as AgentId[];

  if (selectedAgents.length > 0) {
    note('Some agents may require user-level MCP config when project-scope MCP is not supported.', 'Agent setup');
  }

  return selectedAgents;
}

function applyMcpServerInstall(context: AgentsContext): void {
  const env = context.env;
  if (isMcpServerInstalled(env)) {
    log.success('@letsrunit/mcp-server already installed');
    return;
  }

  const s = spinner();
  s.start('Installing @letsrunit/mcp-server…');
  installMcpServer(env);
  s.stop('@letsrunit/mcp-server installed');
}

export async function setupAgentIntegration(context: AgentsContext): Promise<void> {
  const explicit = hasExplicitInitSelections(context.options);
  const agents = explicit ? explicitAgents(context) : await selectAgents(context);
  const installMcp = explicit ? Boolean(context.options.withMcp) || agents.length > 0 : agents.length > 0;

  if (installMcp) applyMcpServerInstall(context);
  await setupAgents(context.env, { agents });
}
