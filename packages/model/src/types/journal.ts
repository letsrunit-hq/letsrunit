import { z } from 'zod';
import { type Data, UUIDSchema } from './utils';

export const EntryTypeSchema = z.enum([
  'debug',
  'info',
  'title',
  'warn',
  'error',
  'prepare',
  'start',
  'success',
  'failure',
]);

export const ArtifactSchema = z.object({
  name: z.string().describe('Human-readable name of the artifact'),
  url: z.url().describe('Public URL where the artifact can be accessed'),
  size: z.number().optional().describe('Artifact size in bytes (if known)'),
});

export const JournalEntrySchema = z.object({
  id: z.string(),
  type: EntryTypeSchema.describe('The kind of entry for rendering and semantics'),
  message: z.string().describe('Primary message content of the entry'),
  meta: z.record(z.string(), z.any()).describe('Additional structured data attached to the entry'),
  artifacts: z.array(ArtifactSchema).describe('Related files or resources linked to the entry'),
  screenshot: ArtifactSchema.readonly().optional().describe('Screenshot of the entry'),
  createdAt: z.coerce.date().describe('Timestamp when the journal entry was created'),
  createdBy: UUIDSchema.nullable().describe('Account id that created the journal entry'),
  updatedAt: z.coerce.date().describe('Timestamp when the journal entry was updated'),
  updatedBy: UUIDSchema.nullable().describe('Account id that updated the journal entry'),
  duration: z.number().optional().readonly().describe('Calculated duration in milliseconds'),
});

export const JournalSchema = z.object({
  runId: z.uuid().describe('Identifier of the run this journal belongs to'),
  entries: z.array(JournalEntrySchema).describe('Chronological list of journal entries'),
});

export type EntryType = z.infer<typeof EntryTypeSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type Journal = z.infer<typeof JournalSchema>;

export type JournalEntryData = Data<Omit<JournalEntry, 'duration'>>;
