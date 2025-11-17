import { z } from 'zod';
import { type Data, UUIDSchema } from './utils';

export const ProjectVisibilitySchema = z.enum(['private', 'public']).describe('Project visibility');

export const ProjectSchema = z.object({
  id: UUIDSchema,
  accountId: UUIDSchema,
  url: z.url().describe('Canonical URL to the home page'),
  title: z.string().describe('Human-readable web app title'),
  description: z.string().describe('Short description of the web application'),
  image: z.url().describe('Public URL of the primary image'),
  favicon: z.url().describe('Public URL of the favicon'),
  lang: z.string().describe('ISO 639 language code'),
  loginAvailable: z.boolean().describe('Whether login is available'),
  visibility: ProjectVisibilitySchema.default('private').describe('Whether the project is public or private'),
  createdAt: z.date().describe('Timestamp when the project was created'),
  createdBy: UUIDSchema.describe('Account id that created the project'),
  updatedAt: z.date().describe('Timestamp when the project was last updated'),
  updatedBy: UUIDSchema.describe('Account id that last updated the project'),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectData = Data<Project>;
