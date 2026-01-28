import { startExploreRun } from '@/actions/explore';
import { useToast } from '@/context/toast-context';
import { findProjectByUrl } from '@letsrunit/model';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
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

vi.mock('@letsrunit/model', () => ({
  findProjectByUrl: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/libs/supabase/browser', () => ({
  connect: vi.fn(() => ({})),
}));

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
  it('starts a new run', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as any);

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.click(button);

    // Get the module to resolve the promise
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('@/actions/explore');
    mod.__resolveRunId('run_123');

    await waitFor(() => {
      expect(findProjectByUrl).toHaveBeenCalledWith('https://example.com', expect.any(Object));
      expect(startExploreRun).toHaveBeenCalledWith('https://example.com', { projectId: undefined });
      expect(push).toHaveBeenCalledWith('/runs/run_123');
    });
  });

  it('disables input and shows loading on button after submit is clicked', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('@/actions/explore');

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    // While promise is pending, input and button should be disabled
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    // resolve the pending promise to avoid unhandled rejections
    mod.__resolveRunId('run_123');

    // wait for state updates to flush so act() is satisfied
    await waitFor(
      () => {
        expect(input).not.toBeDisabled();
        expect(button).not.toBeDisabled();
      },
      { timeout: 10000 },
    );
  }, 15000);

  it('shows error toast if startExploreRun fails', async () => {
    const toast = {
      show: vi.fn(),
    };
    vi.mocked(useToast).mockReturnValue(toast);

    vi.mocked(startExploreRun).mockImplementationOnce(() => Promise.reject(new Error('Failed to start run')));

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to start run',
        }),
      );
    });
  });

  it('redirects to project page if project already exists', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as any);

    vi.mocked(findProjectByUrl).mockResolvedValueOnce({
      id: 'project_123',
      testsCount: 1,
      suggestionsCount: 0,
    } as any);

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(findProjectByUrl).toHaveBeenCalledWith('https://example.com', expect.any(Object));
      expect(push).toHaveBeenCalledWith('/projects/project_123');
    });
  });

  it('does not redirect to project with no tests', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as any);

    vi.mocked(findProjectByUrl).mockResolvedValueOnce({
      id: 'project_123',
      testsCount: 0,
      suggestionsCount: 0,
    } as any);

    render(<ExploreForm placeholder="https://www.example.com" buttonLabel="Run it." />);

    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });

    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.click(button);

    const mod: any = await import('@/actions/explore');
    mod.__resolveRunId('run_123');

    await waitFor(() => {
      expect(findProjectByUrl).toHaveBeenCalledWith('https://example.com', expect.any(Object));
      expect(startExploreRun).toHaveBeenCalledWith('https://example.com', { projectId: 'project_123' });
      expect(push).not.toHaveBeenCalledWith('/projects/project_123');
      expect(push).toHaveBeenCalledWith('/runs/run_123');
    });
  });
});
