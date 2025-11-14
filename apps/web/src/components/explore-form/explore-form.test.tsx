import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

vi.mock('next/client', () => ({
  router: { push: vi.fn(() => Promise.resolve()) },
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
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();

    // resolve the pending promise to avoid unhandled rejections
    mod.__resolveRunId('run_123');

    // wait for state updates to flush so act() is satisfied
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(button).not.toBeDisabled();
    });
  });
});
