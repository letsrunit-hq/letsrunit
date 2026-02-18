import type { JournalEntry, Sink } from '@letsrunit/journal';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface McpLogEntry {
  timestamp: number;
  type: JournalEntry['type'];
  message: string;
  artifacts: string[]; // file paths on disk
}

export class McpSink implements Sink {
  private _entries: McpLogEntry[] = [];

  constructor(private readonly artifactDir: string) {}

  async publish(...entries: JournalEntry[]): Promise<void> {
    await mkdir(this.artifactDir, { recursive: true });

    for (const entry of entries) {
      const paths = await this.storeArtifacts(entry.artifacts);
      this._entries.push({
        timestamp: entry.timestamp,
        type: entry.type,
        message: entry.message,
        artifacts: paths,
      });
    }
  }

  getEntries(): McpLogEntry[] {
    return this._entries;
  }

  getArtifactPaths(): string[] {
    return this._entries.flatMap((e) => e.artifacts);
  }

  clear(): void {
    this._entries = [];
  }

  private async storeArtifacts(artifacts: File[]): Promise<string[]> {
    const paths: string[] = [];

    for (const artifact of artifacts) {
      const dest = join(this.artifactDir, artifact.name);
      const data = await artifact.bytes();
      await writeFile(dest, data);
      paths.push(dest);
    }

    return paths;
  }
}
