import { fireEvent, render, screen } from '@testing-library/react';
import type { ToastMessage } from 'primereact/toast';
// @ts-expect-error mocked helper for tests only
import { __getShowSpy } from 'primereact/toast';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './toast-context';

// Mock primereact/toast so we can observe calls to ref.show
vi.mock('primereact/toast', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React as typeof import('react');

  const showSpy = vi.fn();
  const Toast = forwardRef<any, any>((_props, ref) => {
    useImperativeHandle(ref, () => ({ show: showSpy }));
    return null; // nothing to render for tests
  });

  return {
    Toast,
    __getShowSpy: () => showSpy,
  } as unknown as typeof import('primereact/toast');
});

function DemoCaller() {
  const { show } = useToast();
  const handleClick = () => {
    const msg: ToastMessage = { severity: 'success', summary: 'Saved' } as any;
    show(msg);
  };
  return (
    <button type="button" onClick={handleClick}>
      trigger
    </button>
  );
}

function DemoConsumerOutside() {
  // Using the hook outside provider should throw when rendered
  // but we must reference it so render() triggers the error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ctx = useToast();
  return <div />;
}

describe('ToastContext', () => {
  it('exposes show() that calls underlying Toast ref.show', () => {
    render(
      <ToastProvider>
        <DemoCaller />
      </ToastProvider>,
    );

    const spy = __getShowSpy();
    expect(spy).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByText('trigger'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Saved' }));
  });

  it('throws when useToast is used outside ToastProvider', () => {
    expect(() => render(<DemoConsumerOutside />)).toThrowError('useToast must be used inside ToastProvider');
  });
});
