import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller } from '../src/controller';
import { runner } from '../src/runner';

vi.mock('../src/runner', () => ({
  runner: {
    run: vi.fn(),
    parse: vi.fn(),
    defs: [
      { type: 'Given', source: 'a step', comment: undefined },
      { type: 'When', source: 'another step', comment: 'hidden' },
      { type: 'Then', source: 'a result', comment: 'some comment' },
    ],
  },
}));

vi.mock('@letsrunit/playwright', () => ({
  browse: vi.fn().mockResolvedValue({
    url: vi.fn().mockReturnValue('http://localhost'),
    on: vi.fn(),
  }),
  createDateEngine: {},
  createFieldEngine: {},
  formatHtml: vi.fn().mockResolvedValue('<html></html>'),
  locator: vi.fn(),
  screenshot: vi.fn().mockResolvedValue({ name: 'screenshot.png' }),
  scrollToCenter: vi.fn(),
  snapshot: vi.fn().mockResolvedValue({}),
}));

vi.mock('@playwright/test', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      close: vi.fn(),
      newContext: vi.fn(),
    }),
  },
  selectors: {
    register: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should return valid true if all steps have definitions', async () => {
      vi.mocked(runner.parse).mockReturnValue([{ text: 'Given a step', def: 'Given a step' }]);
      const controller = await Controller.launch();
      const result = controller.validate('Feature: test');
      expect(result.valid).toBe(true);
      expect(result.steps).toHaveLength(1);
      await controller.close();
    });

    it('should return valid false if some steps are missing definitions', async () => {
      vi.mocked(runner.parse).mockReturnValue([
        { text: 'Given a step', def: 'Given a step' },
        { text: 'When missing', def: undefined },
      ]);
      const controller = await Controller.launch();
      const result = controller.validate('Feature: test');
      expect(result.valid).toBe(false);
      await controller.close();
    });
  });

  describe('listSteps', () => {
    it('should list non-hidden steps', async () => {
      const controller = await Controller.launch();
      const steps = controller.listSteps();
      expect(steps).toContain('Given a step');
      expect(steps).not.toContain('When another step');
      expect(steps).toContain('Then a result  # some comment');
      await controller.close();
    });

    it('should filter by type', async () => {
      const controller = await Controller.launch();
      const givenSteps = controller.listSteps('Given');
      expect(givenSteps).toEqual(['Given a step']);
      const thenSteps = controller.listSteps('Then');
      expect(thenSteps).toEqual(['Then a result  # some comment']);
      await controller.close();
    });
  });

  describe('lang', () => {
    it('should return null if world has no lang', async () => {
      const controller = await Controller.launch();
      expect(controller.lang).toBeNull();
      await controller.close();
    });

    it('should return lang from world', async () => {
      // @ts-ignore
      const controller = new Controller({}, { lang: { code: 'en', name: 'English' } }, {}, new Set());
      expect(controller.lang).toEqual({ code: 'en', name: 'English' });
    });
  });

  describe('world methods', () => {
    it('should attach, link and log', async () => {
      const controller = await Controller.launch();
      const world = (controller as any).world;
      const journalSpy = vi.spyOn(controller.journal, 'info');

      await world.link('some link');
      expect(journalSpy).toHaveBeenCalledWith('some link');

      await world.log('some log');
      expect(journalSpy).toHaveBeenCalledWith('some log');

      await world.attach('some data', { type: 'text/plain' });
      expect((controller as any).pendingArtifacts.size).toBe(1);

      await controller.close();
    });
  });

  describe('launch', () => {
    it('should launch with debug enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const controller = await Controller.launch({ debug: true });
      // Trigger console event on page
      const page = (controller as any).world.page;
      const onCall = vi.mocked(page.on).mock.calls.find((call) => call[0] === 'console');
      if (onCall) {
        onCall[1]({ type: () => 'log', text: () => 'hello' });
      }
      expect(consoleSpy).toHaveBeenCalledWith('[page]', 'log', 'hello');
      await controller.close();
      consoleSpy.mockRestore();
    });
  });

  describe('run', () => {
    it('should run a feature and return a result with a page snapshot', async () => {
      const mockResult = {
        status: 'passed',
        steps: [{ text: 'Given a step', status: 'success' }],
        reason: undefined,
      };
      vi.mocked(runner.run).mockImplementation(async (f, w, wrapper, opts) => {
        if (wrapper) {
          await wrapper({ id: '1', text: 'Given a step', args: [] }, async () => ({ status: 'success' }));
        }
        return mockResult as any;
      });

      const controller = await Controller.launch();
      const feature = 'Feature: test\n  Scenario: test\n    Given a step';
      const result = await controller.run(feature);

      expect(runner.run).toHaveBeenCalledWith(feature, expect.anything(), expect.any(Function), {});
      expect(result.status).toBe('passed');
      expect(result.page).toBeDefined();
      await controller.close();
    });

    it('should handle step failure', async () => {
      const mockResult = {
        status: 'failed',
        steps: [{ text: 'Given a step', status: 'failure' }],
        reason: new Error('step failed'),
      };
      vi.mocked(runner.run).mockImplementation(async (f, w, wrapper, opts) => {
        if (wrapper) {
          await wrapper({ id: '1', text: 'Given a step', args: [] }, async () => ({
            status: 'failure',
            reason: new Error('step failed'),
          }));
        }
        return mockResult as any;
      });

      const controller = await Controller.launch();
      const feature = 'Feature: test\n  Scenario: test\n    Given a step';
      const result = await controller.run(feature);

      expect(result.status).toBe('failed');
      expect(result.reason?.message).toBe('step failed');
      await controller.close();
    });

    it('should handle Then steps and visibility checks', async () => {
      const mockResult = {
        status: 'passed',
        steps: [{ text: 'Then I see "text"', status: 'success' }],
        reason: undefined,
      };

      vi.mocked(runner.run).mockImplementation(async (f, w, wrapper, opts) => {
        if (wrapper) {
          const stepDesc = {
            id: '1',
            text: 'Then I see "text"',
            args: [{ getParameterType: () => ({ name: 'locator' }), getValue: () => 'text' }],
          };
          // @ts-ignore
          await wrapper(stepDesc, async () => ({ status: 'success' }));
        }
        return mockResult as any;
      });

      const controller = await Controller.launch();
      const feature = 'Feature: test\n  Scenario: test\n    Then I see "text"';
      const result = await controller.run(feature);

      expect(result.status).toBe('passed');
      await controller.close();
    });

    it('should handle steps that skip locator masking (don\'t see)', async () => {
      const mockResult = {
        status: 'passed',
        steps: [{ text: 'Then I don\'t see "text"', status: 'success' }],
        reason: undefined,
      };

      vi.mocked(runner.run).mockImplementation(async (f, w, wrapper, opts) => {
        if (wrapper) {
          const stepDesc = {
            id: '1',
            text: 'Then I don\'t see "text"',
            args: [{ getParameterType: () => ({ name: 'locator' }), getValue: () => 'text' }],
          };
          // @ts-ignore
          await wrapper(stepDesc, async () => ({ status: 'success' }));
        }
        return mockResult as any;
      });

      const controller = await Controller.launch();
      const result = await controller.run('Feature: test\n  Scenario: test\n    Then I don\'t see "text"');
      expect(result.status).toBe('passed');
      await controller.close();
    });
  });

  describe('error handling', () => {
    it('should handle screenshot failure', async () => {
      const { screenshot } = await import('@letsrunit/playwright');
      vi.mocked(screenshot).mockRejectedValue(new Error('screenshot failed'));
      const mockResult = {
        status: 'passed',
        steps: [{ text: 'Given a step', status: 'success' }],
        reason: undefined,
      };
      vi.mocked(runner.run).mockImplementation(async (f, w, wrapper, opts) => {
        if (wrapper) {
          await wrapper({ id: '1', text: 'Given a step', args: [] }, async () => ({ status: 'success' }));
        }
        return mockResult as any;
      });

      const controller = await Controller.launch();
      await controller.run('Feature: test\n  Scenario: test\n    Given a step');
      // Should not throw
      await controller.close();
    });

    it('should handle formatHtml failure', async () => {
      const { formatHtml } = await import('@letsrunit/playwright');
      vi.mocked(formatHtml).mockRejectedValue(new Error('html failed'));
      const mockResult = {
        status: 'passed',
        steps: [{ text: 'Given a step', status: 'success' }],
        reason: undefined,
      };
      vi.mocked(runner.run).mockImplementation(async (f, w, wrapper, opts) => {
        if (wrapper) {
          await wrapper({ id: '1', text: 'Given a step', args: [] }, async () => ({ status: 'success' }));
        }
        return mockResult as any;
      });

      const controller = await Controller.launch();
      await controller.run('Feature: test\n  Scenario: test\n    Given a step');
      // Should not throw
      await controller.close();
    });
  });
});
