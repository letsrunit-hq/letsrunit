import type { Environment } from '../../detect.js';

export const AGENT_IDS = ['codex', 'cursor', 'claude', 'copilot', 'gemini', 'windsurf'] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export interface AgentStrategy {
  id: AgentId;
  label: string;
  detect(env: Pick<Environment, 'cwd'>): boolean;
  configureMcp(env: Pick<Environment, 'cwd'>): 'created' | 'updated' | 'skipped';
  installSkill(env: Pick<Environment, 'cwd'>): 'installed' | 'skipped';
}
