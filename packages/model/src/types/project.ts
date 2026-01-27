import { z } from 'zod';
import { UUIDSchema } from './utils';

export const ProjectVisibilitySchema = z.enum(['private', 'public']).describe('Project visibility');

export const ProjectBaseSchema = z.object({
  id: UUIDSchema,
  accountId: UUIDSchema,
  url: z.url().describe('Canonical URL to the home page'),
  name: z.string().nullable().optional().describe('Human-readable web app name'),
  description: z.string().nullable().optional().describe('Short description of the web application'),
  image: z.url().nullable().optional().describe('Public URL of the primary image'),
  favicon: z.url().nullable().optional().describe('Public URL of the favicon'),
  screenshot: z.url().nullable().optional().describe('Public URL of the screenshot'),
  lang: z.string().nullable().optional().describe('ISO 639 language code'),
  loginAvailable: z.boolean().nullable().optional().describe('Whether login is available'),
  visibility: ProjectVisibilitySchema.default('private').describe('Whether the project is public or private'),
  createdAt: z.coerce.date().describe('Timestamp when the project was created'),
  createdBy: UUIDSchema.describe('Account id that created the project'),
  updatedAt: z.coerce.date().describe('Timestamp when the project was last updated'),
  updatedBy: UUIDSchema.describe('Account id that last updated the project'),
  testsCount: z.number().readonly().default(0).describe('Number of tests in the project'),
  suggestionsCount: z.number().readonly().default(0).describe('Number of suggestions for the project'),
  passRate: z.number().readonly().default(0).describe('Percentage of passing tests'),
});

export const ProjectSchema = z.preprocess(
  (v: any) => {
    if (typeof v !== 'object' || v === null) return v;
    const { tests, suggestions, runs, ...rest } = v;
    const out = { ...rest };

    if (tests !== undefined) {
      out.testsCount = Array.isArray(tests) ? tests[0]?.count ?? 0 : tests;
    }
    if (suggestions !== undefined) {
      out.suggestionsCount = Array.isArray(suggestions) ? suggestions[0]?.count ?? 0 : suggestions;
    }
    if (runs !== undefined) {
      if (Array.isArray(runs)) {
        if (runs.length === 0) {
          out.passRate = 0;
        } else {
          const passedRuns = runs.filter((r: any) => r.status === 'passed').length;
          out.passRate = Math.round((passedRuns / runs.length) * 100);
        }
      } else {
        out.passRate = runs;
      }
    }
    return out;
  },
  ProjectBaseSchema,
);

export type Project = z.infer<typeof ProjectBaseSchema>;
