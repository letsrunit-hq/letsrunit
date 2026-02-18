import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@letsrunit/controller', () => ({
  Controller: {
    launch: vi.fn(),
  },
}));

vi.mock('@letsrunit/journal', () => ({
  Journal: vi.fn(function () { return {}; }),
  MemorySink: vi.fn(function () {
    return {
      clear: vi.fn(),
      getEntries: vi.fn().mockReturnValue([]),
      getArtifactPaths: vi.fn().mockReturnValue([]),
      publish: vi.fn(),
    };
  }),
}));

import { Controller } from '@letsrunit/controller';
import { SessionManager } from '../src/sessions';

const mockController = {
  run: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
  page: {},
};

beforeEach(() => {
  vi.mocked(Controller.launch).mockResolvedValue(mockController as any);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SessionManager', () => {
  describe('get()', () => {
    it('throws when session does not exist', () => {
      const manager = new SessionManager();
      expect(() => manager.get('unknown')).toThrow('Session not found: unknown');
    });

    it('returns the session after create()', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      expect(manager.get(session.id)).toBe(session);
    });
  });

  describe('has()', () => {
    it('returns false when session does not exist', () => {
      const manager = new SessionManager();
      expect(manager.has('unknown')).toBe(false);
    });

    it('returns true after create()', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      expect(manager.has(session.id)).toBe(true);
    });
  });

  describe('create()', () => {
    it('calls Controller.launch with provided options', async () => {
      const manager = new SessionManager();
      await manager.create({ headless: false, locale: 'fr' });
      expect(Controller.launch).toHaveBeenCalledWith(
        expect.objectContaining({ headless: false, locale: 'fr' }),
      );
    });

    it('returns a session with a non-empty id', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      expect(session.id).toBeTruthy();
    });

    it('returns a session with stepCount 0', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      expect(session.stepCount).toBe(0);
    });

    it('stores the session so list() returns it', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      expect(manager.list()).toContain(session);
    });
  });

  describe('touch()', () => {
    it('updates lastActivity', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      const before = session.lastActivity;

      await new Promise((r) => setTimeout(r, 5));
      manager.touch(session.id);

      expect(session.lastActivity).toBeGreaterThan(before);
    });

    it('is a no-op for an unknown id', () => {
      const manager = new SessionManager();
      expect(() => manager.touch('unknown')).not.toThrow();
    });
  });

  describe('list()', () => {
    it('returns empty array when no sessions exist', () => {
      const manager = new SessionManager();
      expect(manager.list()).toEqual([]);
    });

    it('returns all created sessions', async () => {
      const manager = new SessionManager();
      const a = await manager.create();
      const b = await manager.create();
      expect(manager.list()).toEqual(expect.arrayContaining([a, b]));
    });
  });

  describe('close()', () => {
    it('removes the session', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      await manager.close(session.id);
      expect(manager.has(session.id)).toBe(false);
    });

    it('calls controller.close()', async () => {
      const manager = new SessionManager();
      const session = await manager.create();
      await manager.close(session.id);
      expect(mockController.close).toHaveBeenCalled();
    });

    it('is a no-op for an unknown id', async () => {
      const manager = new SessionManager();
      await expect(manager.close('unknown')).resolves.toBeUndefined();
    });
  });
});
