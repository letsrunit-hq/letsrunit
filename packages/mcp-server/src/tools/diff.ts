import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { unifiedHtmlDiff } from '@letsrunit/playwright';
import { openStore, findLastTest, findArtifacts } from '@letsrunit/store';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import type { SessionManager } from '../sessions';
import { err, text } from '../utility/response';

const DEFAULT_DB_PATH = join(process.cwd(), '.letsrunit', 'letsrunit.db');

function getDbPath(): string {
  return process.env.LETSRUNIT_DB_PATH ?? DEFAULT_DB_PATH;
}

function resolveAllowedCommits(): string[] | undefined {
  try {
    const output = execSync('git log --format=%H', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return undefined;
  }
}

export function registerDiff(server: McpServer, sessions: SessionManager): void {
  server.registerTool(
    'letsrunit_diff',
    {
      description:
        'Diff the current live page against the HTML snapshot from the last passing test of a scenario. ' +
        'Pass the scenarioId returned by letsrunit_run. ' +
        'Returns a unified HTML diff and paths to baseline screenshots. ' +
        'By default only considers baseline tests from the current git ancestry (gitTreeOnly: true).',
      inputSchema: {
        sessionId: z.string().describe('Session ID returned by letsrunit_session_start'),
        scenarioId: z.string().describe('Scenario UUID returned by letsrunit_run'),
        gitTreeOnly: z
          .boolean()
          .optional()
          .describe('Restrict baseline to tests from the current git ancestry (default: true)'),
      },
    },
    async (input) => {
      const dbPath = getDbPath();
      const artifactDir = join(dirname(dbPath), 'artifacts');
      let db: ReturnType<typeof openStore> | undefined;

      try {
        try {
          db = openStore(dbPath);
        } catch {
          return err('Could not open the letsrunit store. Run cucumber with the store formatter first.');
        }

        const allowedCommits = (input.gitTreeOnly ?? true) ? resolveAllowedCommits() : undefined;

        const test = findLastTest(db, input.scenarioId, 'passed', allowedCommits ?? undefined);
        if (!test) {
          return err(
            allowedCommits
              ? 'No passing test found for this scenario in the current git ancestry. Try gitTreeOnly: false or run cucumber first.'
              : 'No passing test found for this scenario.',
          );
        }

        const artifacts = findArtifacts(db, test.id);

        const htmlArtifact = [...artifacts].reverse().find((a) => a.filename.endsWith('.html'));
        if (!htmlArtifact) {
          return err('No HTML snapshot found in the baseline test. Ensure the store formatter is configured.');
        }

        const storedHtml = readFileSync(join(artifactDir, htmlArtifact.filename), 'utf-8');

        const session = sessions.get(input.sessionId);
        sessions.touch(input.sessionId);

        const diff = await unifiedHtmlDiff({ html: storedHtml, url: 'about:blank' }, session.controller.page);

        const screenshots = artifacts
          .filter((a) => a.filename.endsWith('.png'))
          .map((a) => join(artifactDir, a.filename));

        return text(
          JSON.stringify({
            diff,
            baseline: {
              testId: test.id,
              commit: test.gitCommit,
              screenshots,
            },
          }),
        );
      } catch (e) {
        return err(`Diff failed: ${(e as Error).message}`);
      } finally {
        db?.close();
      }
    },
  );
}
