import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureJsonMcpConfig, ensureSkillDirectory, hasAnyPath } from './shared.js';

export const cursorStrategy: AgentStrategy = {
  id: 'cursor',
  label: 'Cursor',
  detect: ({ cwd }) => hasAnyPath([join(cwd, '.cursor'), join(cwd, '.cursor', 'mcp.json')]),
  configureMcp: ({ cwd }) => ensureJsonMcpConfig(join(cwd, '.cursor', 'mcp.json')),
  installSkill: ({ cwd }) => ensureSkillDirectory(cwd),
};
