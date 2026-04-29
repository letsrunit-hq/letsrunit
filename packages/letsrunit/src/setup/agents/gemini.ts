import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureJsonMcpConfig, ensureSkillFile, hasAnyPath } from './shared.js';

export const geminiStrategy: AgentStrategy = {
  id: 'gemini',
  label: 'Gemini CLI',
  detect: ({ cwd }) => hasAnyPath([join(cwd, '.gemini'), join(cwd, 'GEMINI.md')]),
  configureMcp: ({ cwd }) => ensureJsonMcpConfig(join(cwd, '.mcp.json')),
  installSkill: ({ cwd }) => ensureSkillFile(cwd),
};
