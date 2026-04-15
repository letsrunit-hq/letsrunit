import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[i + 1];
    result[key] = value;
    i += 1;
  }

  return result;
}

function main() {
  const args = parseArgs();
  const packageSpec = args.package ?? 'file:/tmp/mcp-server.tgz';
  const workdir = mkdtempSync(join(tmpdir(), 'mcp-npx-tools-list-'));
  const runnerPath = join(workdir, 'run-mcp.sh');
  const serverStderrPath = join(workdir, 'mcp-server.stderr');

  writeFileSync(
    runnerPath,
    `#!/usr/bin/env bash
set -euo pipefail
exec npx -y ${JSON.stringify(packageSpec)} 2>${JSON.stringify(serverStderrPath)}
`,
    'utf8',
  );
  spawnSync('chmod', ['+x', runnerPath], { stdio: 'inherit' });

  try {
    const result = spawnSync(
      'npx',
      ['-y', '@modelcontextprotocol/inspector', '--cli', runnerPath, '--method', 'tools/list'],
      { encoding: 'utf8' },
    );

    if (result.status !== 0) {
      const serverStderr = safeRead(serverStderrPath);
      throw new Error(
        [
          `Inspector failed with status ${result.status ?? 'unknown'}`,
          result.stderr?.trim(),
          serverStderr ? `Server stderr:\n${serverStderr}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }

    const payload = JSON.parse(result.stdout);
    const tools = payload?.tools;
    if (!Array.isArray(tools) || tools.length === 0) {
      throw new Error('No tools returned by npx MCP server');
    }

    if (!tools.some((tool) => tool.name === 'letsrunit_session_start')) {
      throw new Error('npx MCP server missing letsrunit_session_start tool');
    }
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}

function safeRead(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

main();
