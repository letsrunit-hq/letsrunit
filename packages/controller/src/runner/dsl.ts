import { registry, type World } from '@letsrunit/bdd';
import { Runner } from '@letsrunit/gherker';

export const runner = new Runner<World>();
runner.useRegistry(registry);
