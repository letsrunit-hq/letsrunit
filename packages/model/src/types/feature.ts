import { z } from 'zod';
import { UUIDSchema } from './utils';
import { RunSchema } from './run';

export const FeatureSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  name: z.string().describe('A short name'),
  description: z.string().nullable().describe('The full user story of the test'),
  comments: z.string().nullable().describe('Additional comments or instructions for the LLM'),
  body: z.string().nullable().describe('Gherkin feature background and steps'),
  enabled: z.boolean().default(true).describe('Disabled features are not run'),
  lastRun: RunSchema.nullable().describe('Last run of this feature'),
  createdAt: z.coerce.date().describe('Timestamp when the feature was created'),
  createdBy: UUIDSchema.nullable().describe('Account id that created the feature'),
  updatedAt: z.coerce.date().describe('Timestamp when the feature was updated'),
  updatedBy: UUIDSchema.nullable().describe('Account id that updated the feature'),
});

export const SuggestionSchema = FeatureSchema
  .omit({ body: true, comments: true })
  .extend({ done: z.string().describe('Definition of done') });

export type Feature = z.infer<typeof FeatureSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
