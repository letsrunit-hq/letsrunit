import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FALLBACK_SKILL } from './fallback-skill.js';

const MCP_JSON_ENTRY = {
  command: 'npx',
  args: ['-y', '@letsrunit/mcp-server@latest'],
};

export function hasPath(path: string): boolean {
  return existsSync(path);
}

export function hasAnyPath(paths: string[]): boolean {
  return paths.some((path) => existsSync(path));
}

export function homePath(...parts: string[]): string {
  return join(homedir(), ...parts);
}

function sortObject(value: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
}

export function ensureJsonMcpConfig(path: string): 'created' | 'updated' | 'skipped' {
  const existed = existsSync(path);
  let parsed: { mcpServers?: Record<string, unknown> } = {};
  if (existsSync(path)) {
    try {
      parsed = JSON.parse(readFileSync(path, 'utf-8')) as { mcpServers?: Record<string, unknown> };
    } catch {
      parsed = {};
    }
  }

  const current = parsed.mcpServers?.letsrunit;
  const unchanged =
    current &&
    typeof current === 'object' &&
    JSON.stringify(current) === JSON.stringify(MCP_JSON_ENTRY) &&
    parsed.mcpServers;

  if (unchanged) return 'skipped';

  const mcpServers = sortObject({ ...(parsed.mcpServers ?? {}), letsrunit: MCP_JSON_ENTRY });
  const next = { ...parsed, mcpServers };

  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
  return existed ? 'updated' : 'created';
}

const TOML_BLOCK = `[mcp_servers.letsrunit]\ncommand = "npx"\nargs = ["-y", "@letsrunit/mcp-server@latest"]\n`;

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

export function ensureSkillFile(cwd: string): 'installed' | 'skipped' {
  const destination = join(cwd, '.agents', 'skills', 'letsrunit', 'SKILL.md');
  const source = join(cwd, 'node_modules', 'letsrunit');
  const localSource = join(cwd, 'agent', 'skills', 'letsrunit', 'SKILL.md');

  let sourcePath = localSource;
  if (!existsSync(sourcePath)) {
    // fallback for normal package usage when source repo isn't present
    sourcePath = join(source, 'agent', 'skills', 'letsrunit', 'SKILL.md');
  }

  const sourceContent = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf-8') : FALLBACK_SKILL;
  if (existsSync(destination)) {
    const current = readFileSync(destination, 'utf-8');
    if (current === sourceContent) return 'skipped';
  }

  mkdirSync(join(destination, '..'), { recursive: true });
  writeFileSync(destination, sourceContent, 'utf-8');
  return 'installed';
}
