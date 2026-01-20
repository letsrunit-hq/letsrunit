import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStateWithRef } from '../use-state-with-ref';

describe('useStateWithRef', () => {
  it('updates state and ref', () => {
    const { result } = renderHook(() => useStateWithRef(0));
    const [state, setState, ref] = result.current;

    expect(state).toBe(0);
    expect(ref.current).toBe(0);

    act(() => {
      setState(1);
    });

    const [updatedState, , updatedRef] = result.current;
    expect(updatedState).toBe(1);
    expect(updatedRef.current).toBe(1);
  });

  it('updates state with function', () => {
    const { result } = renderHook(() => useStateWithRef(0));
    const [, setState] = result.current;

    act(() => {
      setState((prev) => prev + 1);
    });

    const [updatedState, , updatedRef] = result.current;
    expect(updatedState).toBe(1);
    expect(updatedRef.current).toBe(1);
  });
});
