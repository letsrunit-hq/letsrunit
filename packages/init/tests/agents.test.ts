import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAgents, setupAgents } from '../src/setup/agents.js';
import { ensureCodexToml } from '../src/setup/agents/codex.js';
import { ensureJsonMcpConfig, ensureSkillDirectory } from '../src/setup/agents/shared.js';

const dirs: string[] = [];

function makeDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'letsrunit-agents-'));
  dirs.push(path);
  return path;
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function mockSkillDownload(): void {
  const rootUrl = 'https://api.github.com/repos/letsrunit-hq/agents/contents/skills/letsrunit';
  const docsUrl = 'https://api.github.com/repos/letsrunit-hq/agents/contents/skills/letsrunit/docs';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === rootUrl) {
        return new Response(
          JSON.stringify([
            {
              type: 'file',
              path: 'skills/letsrunit/SKILL.md',
              download_url: 'https://raw.githubusercontent.com/letsrunit-hq/agents/main/skills/letsrunit/SKILL.md',
            },
            {
              type: 'dir',
              path: 'skills/letsrunit/docs',
            },
          ]),
        );
      }
      if (url === docsUrl) {
        return new Response(
          JSON.stringify([
            {
              type: 'file',
              path: 'skills/letsrunit/docs/workflow.md',
              download_url:
                'https://raw.githubusercontent.com/letsrunit-hq/agents/main/skills/letsrunit/docs/workflow.md',
            },
          ]),
        );
      }
      if (url.endsWith('/SKILL.md')) return new Response('real skill');
      if (url.endsWith('/workflow.md')) return new Response('real workflow');
      return new Response('not found', { status: 404 });
    }),
  );
}

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

describe('MCP config writers', () => {
  it('creates json mcp config', () => {
    const dir = makeDir();
    const path = join(dir, '.cursor', 'mcp.json');
    const result = ensureJsonMcpConfig(path);
    expect(result).toBe('created');

    const json = JSON.parse(readFileSync(path, 'utf-8')) as {
      mcpServers: Record<string, { command: string; env?: Record<string, string> }>;
    };
    expect(json.mcpServers.letsrunit.command).toBe('./node_modules/.bin/letsrunit-mcp');
    expect(json.mcpServers.letsrunit.env?.LETSRUNIT_MCP_RUNTIME_MODE).toBe('project');
  });

  it('creates codex toml block and skips if already configured', () => {
    const dir = makeDir();
    const path = join(dir, 'config.toml');
    expect(ensureCodexToml(path)).toBe('created');
    expect(readFileSync(path, 'utf-8')).toContain('command = "./node_modules/.bin/letsrunit-mcp"');
    expect(readFileSync(path, 'utf-8')).toContain('LETSRUNIT_MCP_RUNTIME_MODE = "project"');
    expect(ensureCodexToml(path)).toBe('skipped');
  });
});

describe('setupAgents behavior', () => {
  it('skips configuration in non-interactive mode without --agents', async () => {
    const cwd = makeDir();
    mkdirSync(join(cwd, 'agent', 'skills', 'letsrunit'), { recursive: true });
    writeFileSync(join(cwd, 'agent', 'skills', 'letsrunit', 'SKILL.md'), 'demo', 'utf-8');

    await setupAgents({ cwd, isInteractive: false }, { agents: [] });

    expect(() => readFileSync(join(cwd, '.mcp.json'), 'utf-8')).toThrow();
  });

  it('configures selected agents explicitly', async () => {
    const cwd = makeDir();
    mockSkillDownload();

    await setupAgents({ cwd, isInteractive: false }, { agents: ['cursor', 'codex'] });

    const configPath = join(cwd, '.cursor', 'mcp.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
      mcpServers: Record<string, { command: string; env?: Record<string, string> }>;
    };
    expect(config.mcpServers.letsrunit.command).toBe('./node_modules/.bin/letsrunit-mcp');
    expect(config.mcpServers.letsrunit.env?.LETSRUNIT_MCP_RUNTIME_MODE).toBe('project');

    const skillPath = join(cwd, '.agents', 'skills', 'letsrunit', 'SKILL.md');
    expect(readFileSync(skillPath, 'utf-8')).toBe('real skill');
    expect(readFileSync(join(cwd, '.agents', 'skills', 'letsrunit', 'docs', 'workflow.md'), 'utf-8')).toBe(
      'real workflow',
    );

    const codexConfigPath = join(cwd, '.codex', 'config.toml');
    const codexConfig = readFileSync(codexConfigPath, 'utf-8');
    expect(codexConfig).toContain('command = "./node_modules/.bin/letsrunit-mcp"');
    expect(codexConfig).toContain('LETSRUNIT_MCP_RUNTIME_MODE = "project"');
  });

  it('installs the full letsrunit skill directory from the agent repository', async () => {
    const cwd = makeDir();
    mockSkillDownload();

    expect(await ensureSkillDirectory(cwd)).toBe('installed');
    expect(readFileSync(join(cwd, '.agents', 'skills', 'letsrunit', 'SKILL.md'), 'utf-8')).toBe('real skill');
    expect(readFileSync(join(cwd, '.agents', 'skills', 'letsrunit', 'docs', 'workflow.md'), 'utf-8')).toBe(
      'real workflow',
    );
    expect(await ensureSkillDirectory(cwd)).toBe('skipped');
  });
});
