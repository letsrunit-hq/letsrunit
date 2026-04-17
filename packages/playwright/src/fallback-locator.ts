import { Locator } from '@playwright/test';

type LocatorMethod = (...args: any[]) => any;
type ProxyProperty = string | symbol;

const ACTION_METHODS = new Set([
  'blur',
  'check',
  'clear',
  'click',
  'dblclick',
  'dispatchEvent',
  'dragTo',
  'fill',
  'focus',
  'hover',
  'press',
  'pressSequentially',
  'scrollIntoViewIfNeeded',
  'selectOption',
  'setChecked',
  'setInputFiles',
  'tap',
  'type',
  'uncheck',
]);

const LOCATOR_CHAIN_METHODS = new Set([
  'and',
  'first',
  'last',
  'locator',
  'nth',
  'or',
]);

const NO_WAIT_OPTION_INDEX: Record<string, number> = {
  dragTo: 1,
  fill: 1,
  press: 1,
  pressSequentially: 1,
  selectOption: 1,
  setInputFiles: 1,
  type: 1,
};

function buildOrLocator(candidates: Locator[]): Locator {
  let result = candidates[0];
  for (const candidate of candidates.slice(1)) {
    result = result.or(candidate);
  }
  return result;
}

async function firstPresentFallback(candidates: Locator[]): Promise<Locator | null> {
  for (const candidate of candidates.slice(1)) {
    try {
      if ((await candidate.count()) > 0) return candidate;
    } catch {}
  }
  return null;
}

function withNoWaitTimeout(method: string, args: unknown[]): unknown[] {
  const next = [...args];
  const optionIndex = NO_WAIT_OPTION_INDEX[method] ?? 0;
  const current = next[optionIndex];

  if (current && typeof current === 'object') {
    next[optionIndex] = { ...(current as Record<string, unknown>), timeout: 0 };
  } else {
    next[optionIndex] = { timeout: 0 };
  }
  return next;
}

function handleExpect(primary: Locator, candidates: Locator[]) {
  return (expression: string, options: unknown) => {
    if (expression.includes('to.be.visible') || expression.includes('to.be.attached')) {
      return (buildOrLocator(candidates) as any)._expect(expression, options);
    }
    return (primary as any)._expect(expression, options);
  };
}

function handleAll(candidates: Locator[]) {
  return async () => {
    const all: Locator[] = [];
    for (const candidate of candidates) {
      all.push(...(await candidate.all()));
    }
    return all;
  };
}

function handleLocatorChain(prop: string, candidates: Locator[]) {
  return (...args: any[]) =>
    createFallbackLocator(
      candidates.map((candidate) => {
        const method = (candidate as any)[prop] as LocatorMethod;
        return method.apply(candidate, args);
      }),
    );
}

function handleCount(primary: Locator, candidates: Locator[]) {
  return async () => {
    const primaryCount = await primary.count();
    if (primaryCount > 0) return primaryCount;

    const fallback = await firstPresentFallback(candidates);
    if (!fallback) return primaryCount;

    return fallback.count();
  };
}

function handleAction(prop: string, primary: Locator, candidates: Locator[], primaryMethod: LocatorMethod) {
  return async (...args: any[]) => {
    try {
      return await primaryMethod.apply(primary, args);
    } catch (error) {
      const fallback = await firstPresentFallback(candidates);
      if (!fallback) throw error;
      const fallbackMethod = (fallback as any)[prop] as LocatorMethod;
      return fallbackMethod.apply(fallback, withNoWaitTimeout(prop, args));
    }
  };
}

function handleAsyncFallback(prop: string, primaryMethod: LocatorMethod, primary: Locator, candidates: Locator[]) {
  return (...args: any[]) => {
    const result = primaryMethod.apply(primary, args);
    if (!result || typeof result !== 'object' || typeof (result as Promise<unknown>).catch !== 'function') {
      return result;
    }

    return (result as Promise<unknown>).catch(async (error: unknown) => {
      const fallback = await firstPresentFallback(candidates);
      if (!fallback) throw error;
      const fallbackMethod = (fallback as any)[prop] as LocatorMethod;
      return fallbackMethod.apply(fallback, args);
    });
  };
}

function formatLocatorChain(candidates: Locator[]): string {
  const parts = candidates.map((candidate) => candidate.toString());
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} {fuzzy}`;
}

export function createFallbackLocator(candidates: Locator[]): Locator {
  const primary = candidates[0];
  const unsupported = new Set(['filter', 'getByRole', 'getByLabel']);

  const proxy = new Proxy(primary as unknown as object, {
    get(_target, prop: ProxyProperty) {
      if (typeof prop !== 'string') return (primary as any)[prop];

      switch (prop) {
        case 'toString':
          return () => formatLocatorChain(candidates);
        case 'all':
          return handleAll(candidates);
        case '_expect':
          return handleExpect(primary, candidates);
        case 'count':
          return handleCount(primary, candidates);
      }

      if (unsupported.has(prop)) {
        return () => {
          throw new Error(`FallbackLocator does not support ${prop}`);
        };
      }

      if (LOCATOR_CHAIN_METHODS.has(prop)) {
        return handleLocatorChain(prop, candidates);
      }

      const primaryMethod = (primary as any)[prop] as LocatorMethod;
      if (typeof primaryMethod !== 'function') return primaryMethod;

      if (ACTION_METHODS.has(prop)) {
        return handleAction(prop, primary, candidates, primaryMethod);
      }

      return handleAsyncFallback(prop, primaryMethod, primary, candidates);
    },
  });

  return proxy as Locator;
}
