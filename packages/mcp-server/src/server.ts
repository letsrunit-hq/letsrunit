import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { sessions } from './sessions.js';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function err(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

function getSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return session;
}

export function registerTools(server: McpServer): void {
  // ── letsrunit_session_start ───────────────────────────────────────────────
  server.registerTool(
    'letsrunit_session_start',
    {
      description: 'Launch a new browser session. Does not navigate anywhere — use letsrunit_run with a Given step to navigate.',
      inputSchema: {
        language: z.string().optional().describe("Browser language code, e.g. 'en', 'fr'"),
        headless: z.boolean().optional().describe('Run browser in headless mode (default: true)'),
        viewportWidth: z.number().int().optional().describe('Viewport width in pixels (default: 1280)'),
        viewportHeight: z.number().int().optional().describe('Viewport height in pixels (default: 720)'),
      },
    },
    async (input) => {
      try {
        const viewport =
          input.viewportWidth || input.viewportHeight
            ? { width: input.viewportWidth ?? 1280, height: input.viewportHeight ?? 720 }
            : undefined;

        const session = await sessions.create({
          headless: input.headless ?? true,
          locale: input.language,
          viewport,
        });

        return text(JSON.stringify({ sessionId: session.id }));
      } catch (e) {
        return err(`Failed to start session: ${(e as Error).message}`);
      }
    },
  );

  // ── letsrunit_run ─────────────────────────────────────────────────────────
  server.registerTool(
    'letsrunit_run',
    {
      description:
        'Execute Gherkin steps or a complete feature in the browser. ' +
        'Accepts a single step line, multiple step lines, a full Scenario, or a full Feature. ' +
        'Returns success, current URL, artifact paths, and journal logs. Does not return a page snapshot — call letsrunit_snapshot explicitly if you need the DOM.',
      inputSchema: {
        sessionId: z.string().describe('Session ID returned by letsrunit_session_start'),
        input: z
          .string()
          .describe(
            'Gherkin text to execute: one or more step lines (e.g. "Given I am on \\"https://example.com\\""), a Scenario block, or a full Feature block.',
          ),
      },
    },
    async (input) => {
      try {
        const session = getSession(input.sessionId);
        sessions.touch(input.sessionId);

        // Wrap bare step lines in a minimal Scenario if needed
        const feature = normalizeGherkin(input.input);

        session.sink.clear();
        const result = await session.controller.run(feature);
        session.stepCount += result.steps.length;

        const artifacts = session.sink.getArtifactPaths();
        const logs = session.sink.getEntries();

        const response = {
          success: result.status === 'passed',
          url: result.page.url,
          error: result.reason?.message,
          artifacts,
          logs,
        };

        return text(JSON.stringify(response));
      } catch (e) {
        return err(`Run failed: ${(e as Error).message}`);
      }
    },
  );

  // ── letsrunit_snapshot ────────────────────────────────────────────────────
  server.registerTool(
    'letsrunit_snapshot',
    {
      description:
        'Get the current page HTML on demand. Use selector to scope to a DOM subtree. Use scrub options to strip noise.',
      inputSchema: {
        sessionId: z.string().describe('Session ID'),
        selector: z
          .string()
          .optional()
          .describe('CSS selector — return only the matching element\'s outer HTML instead of the full page'),
        scrubScripts: z.boolean().optional().describe('Remove <script> tags (default: true)'),
        scrubStyles: z.boolean().optional().describe('Remove <style> tags and style= attributes (default: true)'),
        scrubComments: z.boolean().optional().describe('Remove HTML comments (default: true)'),
        scrubDataAttributes: z.boolean().optional().describe('Remove all data-* attributes (default: false)'),
      },
    },
    async (input) => {
      try {
        const session = getSession(input.sessionId);
        sessions.touch(input.sessionId);

        const page = session.controller.page;

        const url: string = page.url();

        let html: string;

        if (input.selector) {
          html = await page.locator(input.selector).first().evaluate((el: Element) => el.outerHTML);
        } else {
          html = await page.content();
        }

        html = scrubHtml(html, {
          scripts: input.scrubScripts ?? true,
          styles: input.scrubStyles ?? true,
          comments: input.scrubComments ?? true,
          dataAttributes: input.scrubDataAttributes ?? false,
        });

        return text(JSON.stringify({ url, html }));
      } catch (e) {
        return err(`Snapshot failed: ${(e as Error).message}`);
      }
    },
  );

  // ── letsrunit_screenshot ──────────────────────────────────────────────────
  server.registerTool(
    'letsrunit_screenshot',
    {
      description:
        'Take a screenshot of the current page. Optionally crop to a specific element (selector) or highlight elements before capturing (highlight).',
      inputSchema: {
        sessionId: z.string().describe('Session ID'),
        selector: z
          .string()
          .optional()
          .describe('CSS selector — crop screenshot to the bounding box of this element'),
        highlight: z
          .array(z.string())
          .optional()
          .describe('CSS selectors whose matching elements are outlined before the screenshot is taken'),
        fullPage: z.boolean().optional().describe('Capture the full scrollable page (default: false)'),
      },
    },
    async (input) => {
      try {
        const session = getSession(input.sessionId);
        sessions.touch(input.sessionId);

        const page = session.controller.page;

        // Inject highlights if requested
        if (input.highlight?.length) {
          await injectHighlights(page, input.highlight);
        }

        let buffer: Buffer;

        try {
          if (input.selector) {
            buffer = await page.locator(input.selector).first().screenshot();
          } else {
            buffer = await page.screenshot({ fullPage: input.fullPage ?? false });
          }
        } finally {
          if (input.highlight?.length) {
            await removeHighlights(page);
          }
        }

        // Save to artifact dir
        const { mkdir, writeFile } = await import('node:fs/promises');
        const { join } = await import('node:path');
        await mkdir(session.artifactDir, { recursive: true });
        const filename = `screenshot-${Date.now()}.png`;
        const path = join(session.artifactDir, filename);
        await writeFile(path, buffer);

        return text(JSON.stringify({ path, mimeType: 'image/png' }));
      } catch (e) {
        return err(`Screenshot failed: ${(e as Error).message}`);
      }
    },
  );

  // ── letsrunit_debug ───────────────────────────────────────────────────────
  server.registerTool(
    'letsrunit_debug',
    {
      description:
        'Evaluate JavaScript on the current page via Playwright page.evaluate(). Use for debugging — not for test logic.',
      inputSchema: {
        sessionId: z.string().describe('Session ID'),
        script: z.string().describe('JavaScript expression or function body to evaluate in the page context'),
      },
    },
    async (input) => {
      try {
        const session = getSession(input.sessionId);
        sessions.touch(input.sessionId);

        const page = session.controller.page;

        const result = await page.evaluate(input.script);
        return text(JSON.stringify({ result }));
      } catch (e) {
        return text(JSON.stringify({ result: null, error: (e as Error).message }));
      }
    },
  );

  // ── letsrunit_session_close ───────────────────────────────────────────────
  server.registerTool(
    'letsrunit_session_close',
    {
      description: 'Close a browser session and release its resources.',
      inputSchema: {
        sessionId: z.string().describe('Session ID to close'),
      },
    },
    async (input) => {
      try {
        const session = sessions.get(input.sessionId);
        const artifactCount = session ? session.sink.getArtifactPaths().length : 0;
        const artifactDir = session?.artifactDir;

        await sessions.close(input.sessionId);

        return text(JSON.stringify({ success: true, artifactCount, artifactDir }));
      } catch (e) {
        return err(`Failed to close session: ${(e as Error).message}`);
      }
    },
  );

  // ── letsrunit_list_sessions ───────────────────────────────────────────────
  server.registerTool(
    'letsrunit_list_sessions',
    {
      description: 'List all active browser sessions.',
      inputSchema: {},
    },
    async () => {
      const list = sessions.list().map((s) => ({
        sessionId: s.id,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        stepCount: s.stepCount,
        artifactDir: s.artifactDir,
      }));

      return text(JSON.stringify({ sessions: list }));
    },
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeGherkin(input: string): string {
  const trimmed = input.trim();

  // Already a Feature or Scenario block — pass through
  if (/^(Feature|Scenario|Background):/im.test(trimmed)) {
    return trimmed;
  }

  // Bare step lines — wrap in a minimal Scenario
  return `Feature: MCP\n\nScenario: Steps\n  ${trimmed.split('\n').join('\n  ')}`;
}

interface ScrubOptions {
  scripts: boolean;
  styles: boolean;
  comments: boolean;
  dataAttributes: boolean;
}

function scrubHtml(html: string, opts: ScrubOptions): string {
  if (opts.comments) {
    html = html.replace(/<!--[\s\S]*?-->/g, '');
  }
  if (opts.scripts) {
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  }
  if (opts.styles) {
    html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
    html = html.replace(/\s+style="[^"]*"/gi, '');
  }
  if (opts.dataAttributes) {
    html = html.replace(/\s+data-[a-z0-9-]+=(?:"[^"]*"|'[^']*'|\S+)/gi, '');
  }
  return html;
}

async function injectHighlights(page: any, selectors: string[]): Promise<void> {
  await page.evaluate((sels: string[]) => {
    const style = document.createElement('style');
    style.id = '__lri_highlight_style__';
    style.textContent = `.__lri_highlight__ { outline: 3px solid #f90 !important; outline-offset: 2px !important; }`;
    document.head.appendChild(style);

    for (const sel of sels) {
      try {
        document.querySelectorAll(sel).forEach((el) => el.classList.add('__lri_highlight__'));
      } catch {}
    }
  }, selectors);
}

async function removeHighlights(page: any): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll('.__lri_highlight__').forEach((el) => el.classList.remove('__lri_highlight__'));
    document.getElementById('__lri_highlight_style__')?.remove();
  });
}
