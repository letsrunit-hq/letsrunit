import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureSkillFile, homePath } from './shared.js';

const TOML_BLOCK = `[mcp_servers.letsrunit]\ncommand = "./node_modules/.bin/letsrunit-mcp"\n\n[mcp_servers.letsrunit.env]\nLETSRUNIT_MCP_RUNTIME_MODE = "project"\n`;

export function ensureCodexToml(path: string): 'created' | 'updated' | 'skipped' {
  if (!existsSync(path)) {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, `${TOML_BLOCK}\n`, 'utf-8');
    return 'created';
  }

  const content = readFileSync(path, 'utf-8');
  if (/\[mcp_servers\.letsrunit\]/.test(content)) {
    return 'skipped';
  }

  const separator = content.endsWith('\n') ? '' : '\n';
  writeFileSync(path, `${content}${separator}\n${TOML_BLOCK}\n`, 'utf-8');
  return 'updated';
}

export function projectInCodexConfig(path: string, cwd: string): boolean {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, 'utf-8');
  const escaped = cwd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\[projects\\."${escaped}"\\]`);
  return pattern.test(content);
}

export const codexStrategy: AgentStrategy = {
  id: 'codex',
  label: 'Codex CLI',
  detect: ({ cwd }) => {
    const localConfig = join(cwd, '.codex', 'config.toml');
    const homeConfig = homePath('.codex', 'config.toml');
    if (projectInCodexConfig(homeConfig, cwd)) return true;
    if (projectInCodexConfig(localConfig, cwd)) return true;
    return false;
  },
  configureMcp: ({ cwd }) => {
    const localConfig = join(cwd, '.codex', 'config.toml');
    const homeConfig = homePath('.codex', 'config.toml');
    if (projectInCodexConfig(homeConfig, cwd) || !projectInCodexConfig(localConfig, cwd)) {
      return ensureCodexToml(homeConfig);
    }
    return ensureCodexToml(localConfig);
  },
  installSkill: ({ cwd }) => ensureSkillFile(cwd),
};
