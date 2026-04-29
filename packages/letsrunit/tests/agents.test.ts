import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseAgents, setupAgents } from '../src/setup/agents.js';
import { ensureCodexToml, ensureJsonMcpConfig, projectInCodexConfig } from '../src/setup/agents/shared.js';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-agents-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseAgents', () => {
  it('parses comma separated list', () => {
    expect(parseAgents('codex,cursor')).toEqual(['codex', 'cursor']);
  });

  it('deduplicates values', () => {
    expect(parseAgents('codex,codex')).toEqual(['codex']);
  });

  it('throws for unknown value', () => {
    expect(() => parseAgents('unknown')).toThrow(/Unknown agent/);
  });
});

describe('codex project detection', () => {
  it('detects project in config toml', () => {
    const dir = makeDir();
    const path = join(dir, 'config.toml');
    const cwd = '/tmp/example';
    writeFileSync(path, `[projects."${cwd}"]\ntrust_level = "trusted"\n`, 'utf-8');
    expect(projectInCodexConfig(path, cwd)).toBe(true);
  });
});

describe('MCP config writers', () => {
  it('creates json mcp config', () => {
    const dir = makeDir();
    const path = join(dir, '.cursor', 'mcp.json');
    const result = ensureJsonMcpConfig(path);
    expect(result).toBe('created');

    const json = JSON.parse(readFileSync(path, 'utf-8')) as { mcpServers: Record<string, unknown> };
    expect(json.mcpServers.letsrunit).toBeDefined();
  });

  it('creates codex toml block and skips if already configured', () => {
    const dir = makeDir();
    const path = join(dir, 'config.toml');
    expect(ensureCodexToml(path)).toBe('created');
    expect(ensureCodexToml(path)).toBe('skipped');
  });
});

describe('setupAgents behavior', () => {
  it('skips configuration in non-interactive mode without --agents', async () => {
    const cwd = makeDir();
    mkdirSync(join(cwd, 'agent', 'skills', 'letsrunit'), { recursive: true });
    writeFileSync(join(cwd, 'agent', 'skills', 'letsrunit', 'SKILL.md'), 'demo', 'utf-8');

    await setupAgents({ cwd, isInteractive: false }, { yes: false, noMcp: false, agents: [] });

    expect(() => readFileSync(join(cwd, '.mcp.json'), 'utf-8')).toThrow();
  });

  it('configures selected agents explicitly', async () => {
    const cwd = makeDir();
    mkdirSync(join(cwd, 'agent', 'skills', 'letsrunit'), { recursive: true });
    writeFileSync(join(cwd, 'agent', 'skills', 'letsrunit', 'SKILL.md'), 'demo', 'utf-8');

    await setupAgents({ cwd, isInteractive: false }, { yes: true, noMcp: false, agents: ['cursor'] });

    const configPath = join(cwd, '.cursor', 'mcp.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as { mcpServers: Record<string, unknown> };
    expect(config.mcpServers.letsrunit).toBeDefined();

    const skillPath = join(cwd, '.agents', 'skills', 'letsrunit', 'SKILL.md');
    expect(readFileSync(skillPath, 'utf-8')).toBe('demo');
  });
});
