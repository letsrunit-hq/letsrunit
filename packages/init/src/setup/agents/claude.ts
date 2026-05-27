import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureJsonMcpConfig, ensureSkillFile, hasAnyPath } from './shared.js';

export const claudeStrategy: AgentStrategy = {
  id: 'claude',
  label: 'Claude Code',
  detect: ({ cwd }) => hasAnyPath([join(cwd, '.claude'), join(cwd, 'CLAUDE.md')]),
  configureMcp: ({ cwd }) => ensureJsonMcpConfig(join(cwd, '.mcp.json')),
  installSkill: ({ cwd }) => ensureSkillFile(cwd),
};
