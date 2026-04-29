import { join } from 'node:path';
import type { AgentStrategy } from './types.js';
import { ensureCodexToml, ensureSkillFile, homePath, projectInCodexConfig } from './shared.js';

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
