import { z } from 'zod';
import { RunSchema } from './run';
import { UUIDSchema } from './utils';

export const FeatureSchema = z.object({
  id: UUIDSchema,
  projectId: UUIDSchema,
  path: z.string().default('/').describe('The URL path of the test'),
  name: z.string().describe('A short name'),
  description: z.string().nullable().describe('The full user story of the test'),
  comments: z.string().nullable().describe('Additional comments or instructions for the LLM'),
  body: z.string().nullable().describe('Gherkin feature background and steps'),
  enabled: z.boolean().default(true).describe('Disabled features are not run'),
  lastRun: z
    .preprocess(
      (v) => Array.isArray(v) ? v[0] : v,
      RunSchema.nullable().optional(),
    )
    .describe('Last run of this feature'),
  createdAt: z.coerce.date().describe('Timestamp when the feature was created'),
  createdBy: UUIDSchema.nullable().describe('Account id that created the feature'),
  updatedAt: z.coerce.date().describe('Timestamp when the feature was updated'),
  updatedBy: UUIDSchema.nullable().describe('Account id that updated the feature'),
});

export const SuggestionSchema = FeatureSchema.pick({
  projectId: true,
  name: true,
  path: true,
  description: true,
  comments: true,
})
  .partial({ name: true, path: true, comments: true })
  .extend({
    done: z.string().optional().describe('Definition of done'),
  });

export type Feature = z.infer<typeof FeatureSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
