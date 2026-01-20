import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ExploreForm } from './explore-form';

vi.mock('@/actions/explore', () => {
  // Create a deferred promise we can resolve in the test
  let resolveFn: (v: string) => void;
  const promise = new Promise<string>((res) => {
    resolveFn = res;
  });
  // expose a way to resolve in test via global
  // but vitest doesn't allow export of internal; instead we return function that returns the same promise every time
  return {
    startExploreRun: vi.fn(() => promise),
    // for test to resolve: attach to globalThis
    __resolveRunId: (id: string) => (resolveFn as (v: string) => void)(id),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/context/toast-context', () => ({
  useToast: vi.fn(() => ({
    show: vi.fn(),
  })),
}));

vi.mock('@/libs/auth', () => ({
  ensureSignedIn: vi.fn(() => Promise.resolve()),
}));

describe('ExploreForm', () => {
  it('disables input and shows loading on button after submit is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('@/actions/explore');

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'https://test.com' } });
    fireEvent.click(button);

    // While promise is pending, input and button should be disabled
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    // resolve the pending promise to avoid unhandled rejections
    mod.__resolveRunId('run_123');

    // wait for state updates to flush so act() is satisfied
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(button).not.toBeDisabled();
    }, { timeout: 10000 });
  }, 15000);

  it('shows error toast if startExploreRun fails', async () => {
    const { startExploreRun } = await import('@/actions/explore');
    const { useToast } = await import('@/context/toast-context');

    const toast = {
      show: vi.fn(),
    };
    vi.mocked(useToast).mockReturnValue(toast);

    vi.mocked(startExploreRun).mockImplementationOnce(() => Promise.reject(new Error('Failed to start run')));

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    fireEvent.change(input, { target: { value: 'https://test.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to start run',
        })
      );
    });
  });
});
