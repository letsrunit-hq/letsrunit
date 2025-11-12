import type { Sink, JournalEntry } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';
import { File } from 'node:buffer';

interface SupabaseSinkOptions {
  client: SupabaseClient;
  runId: string;
  storageBucket?: string;
}

export class SupabaseSink implements Sink {
  private readonly supabase: SupabaseClient;
  private readonly runId: string;
  private readonly bucket?: string;

  constructor(options: SupabaseSinkOptions) {
    this.supabase = options.client;
    this.runId = options.runId;
    this.bucket = options.storageBucket;
  }

  async publish(...entries: JournalEntry[]): Promise<void> {
    for (const entry of entries) {
      const artifactList = await this.storeArtifacts(entry.artifacts);

      const { error } = await this.supabase.from('log_entries').insert({
        run_id: this.runId,
        type: entry.type,
        message: entry.message,
        meta: entry.meta ?? {},
        artifacts: artifactList,
        created_at: new Date().toISOString(),
      });

      if (error) console.error('SupabaseSink insert failed:', error);
    }
  }

  private async storeArtifacts(artifacts: File[]): Promise<any[]> {
    if (!this.bucket || artifacts.length === 0) return [];

    const stored: any[] = [];

    for (const artifact of artifacts) {
      const path = `${this.runId}/${artifact.name}`;
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .upload(path, await artifact.bytes(), { upsert: false });

      if (error) {
        console.error('SupabaseSink upload failed:', error);
        continue;
      }

      const { data: publicUrl } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(path);

      stored.push({
        name: artifact.name,
        url: publicUrl.publicUrl,
        size: artifact.size,
      });
    }

    return stored;
  }
}
