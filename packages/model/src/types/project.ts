import { z } from 'zod';
import { UUIDSchema } from './utils';

export const ProjectVisibilitySchema = z.enum(['private', 'public']).describe('Project visibility');

export const ProjectSchema = z.object({
  id: UUIDSchema,
  accountId: UUIDSchema,
  url: z.url().describe('Canonical URL to the home page'),
  name: z.string().nullable().describe('Human-readable web app name'),
  description: z.string().nullable().describe('Short description of the web application'),
  image: z.url().nullable().describe('Public URL of the primary image'),
  favicon: z.url().nullable().describe('Public URL of the favicon'),
  screenshot: z.url().nullable().describe('Public URL of the screenshot'),
  lang: z.string().nullable().describe('ISO 639 language code'),
  loginAvailable: z.boolean().nullable().describe('Whether login is available'),
  visibility: ProjectVisibilitySchema.default('private').describe('Whether the project is public or private'),
  createdAt: z.coerce.date().describe('Timestamp when the project was created'),
  createdBy: UUIDSchema.describe('Account id that created the project'),
  updatedAt: z.coerce.date().describe('Timestamp when the project was last updated'),
  updatedBy: UUIDSchema.describe('Account id that last updated the project'),
});

export type Project = z.infer<typeof ProjectSchema>;
