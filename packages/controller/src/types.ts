import { Result as RunResult } from '@letsrunit/gherker';

export interface Snapshot {
  url: string,
  html: string,
  screenshot: Uint8Array,
}

export type Result = Omit<RunResult, 'world'> & { page: Snapshot };
