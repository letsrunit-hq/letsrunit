import { z } from 'zod';
import { type Data, UUIDSchema } from './utils';

export const ProjectSchema = z.object({
  id: UUIDSchema,
  url: z.url().describe('Canonical URL to the home page'),
  title: z.string().describe('Human-readable web app title'),
  description: z.string().describe('Short description of the web application'),
  image: z.url().describe('Public URL of the primary image'),
  favicon: z.url().describe('Public URL of the favicon'),
  lang: z.string().describe('ISO 639 language code'),
  loginAvailable: z.boolean().describe('Whether login is available'),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectData = Data<Project>;
