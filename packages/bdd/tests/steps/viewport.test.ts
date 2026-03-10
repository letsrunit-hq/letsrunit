import { describe, expect, it, vi } from 'vitest';
import { viewport as viewportStep } from '../../src/steps/viewport';
import { runStep } from '../helpers';

describe('steps/viewport', () => {
  it('sets mobile viewport size', async () => {
    const setViewportSize = vi.fn();
    const viewportSize = vi.fn().mockReturnValue({ width: 0, height: 0 });
    const page = { setViewportSize, viewportSize } as any;

    await runStep(viewportStep, "I'm on a mobile device", { page } as any);

    expect(setViewportSize).toHaveBeenCalledWith({ width: 375, height: 812 });
  });

  it('sets tablet viewport size', async () => {
    const setViewportSize = vi.fn();
    const viewportSize = vi.fn().mockReturnValue({ width: 0, height: 0 });
    const page = { setViewportSize, viewportSize } as any;

    await runStep(viewportStep, "I'm on a tablet device", { page } as any);

    expect(setViewportSize).toHaveBeenCalledWith({ width: 768, height: 1024 });
  });

  it('sets desktop viewport size', async () => {
    const setViewportSize = vi.fn();
    const viewportSize = vi.fn().mockReturnValue({ width: 0, height: 0 });
    const page = { setViewportSize, viewportSize } as any;

    await runStep(viewportStep, "I'm on a desktop device", { page } as any);

    expect(setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
  });

  it('does not set viewport size if already correct', async () => {
    const setViewportSize = vi.fn();
    // Desktop size: { width: 1920, height: 1080 }
    const viewportSize = vi.fn().mockReturnValue({ width: 1920, height: 1080 });
    const page = { setViewportSize, viewportSize } as any;

    await runStep(viewportStep, "I'm on a desktop device", { page } as any);

    expect(setViewportSize).not.toHaveBeenCalled();
  });

  it('sets viewport size if only width is different', async () => {
    const setViewportSize = vi.fn();
    const viewportSize = vi.fn().mockReturnValue({ width: 1000, height: 1080 });
    const page = { setViewportSize, viewportSize } as any;

    await runStep(viewportStep, "I'm on a desktop device", { page } as any);

    expect(setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
  });

  it('sets viewport size if only height is different', async () => {
    const setViewportSize = vi.fn();
    const viewportSize = vi.fn().mockReturnValue({ width: 1920, height: 1000 });
    const page = { setViewportSize, viewportSize } as any;

    await runStep(viewportStep, "I'm on a desktop device", { page } as any);

    expect(setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
  });
});
