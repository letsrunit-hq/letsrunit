import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureJsonMcpConfig, ensureSkillDirectory, hasAnyPath } from './shared.js';

export const windsurfStrategy: AgentStrategy = {
  id: 'windsurf',
  label: 'Windsurf',
  detect: ({ cwd }) => hasAnyPath([join(cwd, '.windsurf'), join(cwd, '.codeium')]),
  configureMcp: ({ cwd }) => ensureJsonMcpConfig(join(cwd, '.mcp.json')),
  installSkill: ({ cwd }) => ensureSkillDirectory(cwd),
};
