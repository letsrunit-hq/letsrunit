import { z } from 'zod';
import { UUIDSchema } from './utils';

export const SuggestionSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  name: z.string().describe('A short name of the user action (3–8 words)'),
  description: z.string().describe('The full (expected) user story following the initial action (10-30 words)'),
  done: z
    .string()
    .describe(
      'A short statement describing the visible or logical end condition confirming successful completion (8–15 words).',
    ),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;
