import type { Feature } from '@letsrunit/gherkin';

export interface Result {
  status: 'passed' | 'failed' | 'error';
  feature?: Feature;
}
