import { z } from 'zod';
import type { Data } from './utils';

export const EntryTypeSchema = z.enum(['debug', 'info', 'title', 'warn', 'error', 'prepare', 'success', 'failure']);

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
  createdAt: z.string().describe('ISO timestamp string indicating when the entry was created'),
});

export const JournalSchema = z.object({
  runId: z.uuid().describe('Identifier of the run this journal belongs to'),
  entries: z.array(JournalEntrySchema).describe('Chronological list of journal entries'),
});

export type EntryType = z.infer<typeof EntryTypeSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type Journal = z.infer<typeof JournalSchema>;

export type JournalEntryData = Data<JournalEntry>;
