import { SupabaseClient } from '@supabase/supabase-js';
import type { JournalEntry, Sink } from '../types';

interface SupabaseSinkOptions {
  supabase: SupabaseClient;
  run: { id: string; projectId: string };
  tableName?: string;
  bucket?: string;
  console?: { error: (...args: any[]) => void; warn: (...args: any[]) => void };
}

export class SupabaseSink implements Sink {
  private readonly supabase: SupabaseClient;
  private readonly projectId: string;
  private readonly runId: string;
  private readonly tableName: string;
  private readonly bucket?: string;
  private readonly console: { error: (...args: any[]) => void; warn: (...args: any[]) => void };
  private bucketEnsured = false;

  constructor(options: SupabaseSinkOptions) {
    this.supabase = options.supabase;
    this.runId = options.run.id;
    this.projectId = options.run.projectId;
    this.tableName = options.tableName ?? 'log_entries';
    this.bucket = options.bucket;
    this.console = options.console || console;
  }

  async publish(...entries: JournalEntry[]): Promise<void> {
    for (const entry of entries) {
      const artifactList = await this.storeArtifacts(entry.artifacts);

      const { error } = await this.supabase.from(this.tableName).insert({
        run_id: this.runId,
        type: entry.type,
        message: entry.message,
        meta: entry.meta ?? {},
        artifacts: artifactList,
        created_at: new Date().toISOString(),
      });

      if (error) {
        this.console.error('SupabaseSink insert failed:', error);
      }
    }
  }

  private async ensureBucket() {
    if (!this.bucket || this.bucketEnsured) return;

    try {
      await this.supabase.storage?.createBucket?.(this.bucket, { public: true });
      this.bucketEnsured = true;
    } catch (error) {
      this.console.warn(error);
    }
  }

  private async storeArtifacts(artifacts: File[]): Promise<any[]> {
    if (!this.bucket || artifacts.length === 0) return [];

    await this.ensureBucket();

    const stored: any[] = [];

    const uniqueArtifacts = artifacts.filter(
      (artifact, index, self) => index === self.findIndex((a) => a.name === artifact.name),
    );

    for (const artifact of uniqueArtifacts) {
      try {
        const path = `${this.projectId}/${artifact.name}`;
        const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
        const publicUrl = data.publicUrl;

        const exists = await this.artifactExists(publicUrl);

        if (!exists) {
          const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(path, await artifact.bytes(), { contentType: artifact.type, upsert: true });
          if (error) throw error;
        }

        stored.push({
          name: artifact.name,
          url: publicUrl,
          size: artifact.size,
        });
      } catch (error) {
        this.console.warn('SupabaseSink upload failed:', error);
      }
    }

    return stored;
  }

  private async artifactExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}
