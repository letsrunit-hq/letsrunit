import { z } from 'zod';
import { type Data, UUIDSchema } from './utils';

export const RunTypeSchema = z.enum(['explore', 'test']);
export const RunStatusSchema = z.enum(['queued', 'running', 'success', 'failed', 'error']);

export const RunSchema = z.object({
  id: UUIDSchema,
  type: RunTypeSchema.describe('The mode of the run defining the workflow to execute'),
  projectId: UUIDSchema.describe('Identifier of the project this run belongs to'),
  target: z.url().describe('The target URL for the run'),
  status: RunStatusSchema.describe('Current execution status of the run'),
  error: z.string().optional().describe('Error message in case of an error during the run'),
  startedAt: z.date().optional().describe('Timestamp when the run started'),
  finishedAt: z.date().optional().describe('Timestamp when the run finished'),
});

export type RunType = z.infer<typeof RunTypeSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type Run = z.infer<typeof RunSchema>;
export type RunData = Data<Run>;
