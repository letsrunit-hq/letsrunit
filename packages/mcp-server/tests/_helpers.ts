import { vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Session, SessionManager } from '../src/sessions';

/**
 * Captures the handler registered by a registerXxx function so it can be
 * called directly in tests without a real McpServer.
 */
export function captureHandler(
  register: (server: McpServer, sessions: SessionManager) => void,
  sessions: SessionManager,
): (input: any) => Promise<any> {
  let handler: (input: any) => Promise<any>;

  const server = {
    registerTool: (_name: string, _schema: any, h: typeof handler) => {
      handler = h;
    },
  } as unknown as McpServer;

  register(server, sessions);

  return (input: any) => handler(input);
}

/** Parse the JSON payload from a text() response. */
export function parseResult(result: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(result.content[0].text);
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'sess-abc',
    controller: {
      run: vi.fn(),
      page: {
        url: vi.fn().mockReturnValue('http://example.com'),
        evaluate: vi.fn(),
        content: vi.fn().mockResolvedValue('<html><body></body></html>'),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            evaluate: vi.fn(),
            screenshot: vi.fn(),
          }),
        }),
        screenshot: vi.fn(),
      },
    } as any,
    sink: {
      clear: vi.fn(),
      getEntries: vi.fn().mockReturnValue([]),
      publish: vi.fn(),
      getArtifactPaths: vi.fn().mockReturnValue([]),
    } as any,
    journal: {} as any,
    artifactDir: '/artifacts/sess-abc',
    createdAt: 1000,
    lastActivity: 1000,
    stepCount: 0,
    ...overrides,
  } as Session;
}

export function makeSessionManager(overrides: Partial<Record<keyof SessionManager, any>> = {}): SessionManager {
  return {
    get: vi.fn(),
    has: vi.fn(),
    touch: vi.fn(),
    create: vi.fn(),
    close: vi.fn(),
    list: vi.fn().mockReturnValue([]),
    ...overrides,
  } as unknown as SessionManager;
}
