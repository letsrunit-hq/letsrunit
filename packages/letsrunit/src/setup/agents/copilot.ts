import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureJsonMcpConfig, ensureSkillFile, hasAnyPath } from './shared.js';

export const copilotStrategy: AgentStrategy = {
  id: 'copilot',
  label: 'GitHub Copilot',
  detect: ({ cwd }) => hasAnyPath([join(cwd, '.github', 'copilot-instructions.md'), join(cwd, '.vscode')]),
  configureMcp: ({ cwd }) => ensureJsonMcpConfig(join(cwd, '.mcp.json')),
  installSkill: ({ cwd }) => ensureSkillFile(cwd),
};
