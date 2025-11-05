export function sanitizeStepDefinition<T extends string | RegExp>(step: T): T {
  if (typeof step !== 'string') {
    return step;
  }

  return step.replace(/\{([^|}]+)\|[^}]+}/g, '{$1}') as any;
}
