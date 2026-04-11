export * from './parameters';
export * from './types';
export { toFile } from './utils/file';
export { Given, When, Then, registry, createRegistry, resetRegistry } from './registry';
import './steps';
import { registry } from './registry';

const builtInDefinitions = registry.definitions.map((definition) => ({
  type: definition.type,
  expression: definition.expression,
  fn: definition.fn,
  comment: definition.comment,
}));

export function resetRegistryToBuiltInSteps(): void {
  registry.reset();
  for (const definition of builtInDefinitions) {
    registry.defineStep(definition.type, definition.expression, definition.fn, definition.comment);
  }
}
