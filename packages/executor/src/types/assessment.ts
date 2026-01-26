import * as z from 'zod';

export const ActionSchema = z.object({
  name: z.string().describe('A short name of the user action (3–8 words)'),
  description: z.string().describe('The full (expected) user story following the initial action (10-30 words)'),
  done: z
    .string()
    .describe(
      'A short statement describing the visible or logical end condition confirming successful completion (8–15 words).',
    ),
});

export type Action = z.infer<typeof ActionSchema>;

export const AssessmentSchema = z.object({
  purpose: z
    .string()
    .describe('Concise sentence describing the primary purpose of a user visiting the site/app (20-50 words)'),
  websiteName: z
    .string()
    .optional()
    .describe('The name of the website, company, or project, determined from name or metadata.'),
  loginAvailable: z.boolean().describe('True if login or sign-up is visible on the page; otherwise false.'),
  actions: z
    .array(ActionSchema.describe('A specific user action that can can be started from the page.'))
    .min(1, 'At least 1 action required')
    .max(5, 'No more than 5 actions allowed')
    .describe('List of 1-5 main things a first-time visitor can do without logging in.'),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
