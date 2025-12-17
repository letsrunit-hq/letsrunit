import type { Result as RunResult } from '@letsrunit/gherker';
import type { Snapshot } from '@letsrunit/playwright';

export type Result = Omit<RunResult, 'world'> & { page: Snapshot };
