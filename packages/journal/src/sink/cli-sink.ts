import { statusSymbol } from '@letsrunit/utils';
import { cursorLeft, cursorUp, eraseDown } from 'ansi-escapes';
import { File } from 'node:buffer';
import { writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import type { JournalEntry, Sink } from '../types';

type WriteFile = typeof writeFile;

interface CliSinkOptions {
  stream?: NodeJS.WriteStream;
  verbosity?: number;
  artifactPath?: string;
  writeFile?: WriteFile;
}

function colorize(type: JournalEntry['type'], text: string): string {
  // ANSI escape codes: debug=bright black (gray), warn=yellow, error=red, info=no color
  switch (type) {
    case 'debug':
    case 'prepare':
      return `\x1b[90m${text}\x1b[0m`;
    case 'warn':
      return `\x1b[33m${text}\x1b[0m`;
    case 'error':
    case 'failure':
      return `\x1b[31m${text}\x1b[0m`;
    case 'success':
      return `\x1b[32m${text}\x1b[0m`;
    case 'title':
      return `\x1b[1m${text}\x1b[0m`;
    case 'info':
    default:
      return text;
  }
}

export class CliSink implements Sink {
  public readonly stream: NodeJS.WriteStream;
  public readonly verbosity: number;
  public readonly artifactPath: string | undefined;
  private readonly writeFile: WriteFile;

  private entries: JournalEntry[] = [];

  constructor(options: CliSinkOptions = {}) {
    this.stream = options.stream ?? process.stdout;
    this.verbosity = options.verbosity ?? 1;
    this.artifactPath = options.artifactPath;
    this.writeFile = options.writeFile ?? writeFile;
  }

  async publish(...entries: JournalEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.type === 'debug' && this.verbosity < 2) continue;
      if (entry.type !== 'error' && this.verbosity < 1) continue;

      if (entry.type === 'title') this.endSection();

      this.replace(entry) || this.append(entry);

      await this.storeArtifacts(entry.artifacts);
    }
  }

  endSection() {
    this.entries = [];
  }

  private replace(entry: JournalEntry): boolean {
    if (entry.type !== 'start' && entry.type !== 'success' && entry.type !== 'failure') return false;

    const index = this.entries.findLastIndex(
      (e) => e.message === entry.message &&
        (e.type === 'prepare' || (e.type === 'start' && entry.type !== 'start'))
    );
    if (index < 0) return false;

    const oldTexts = this.entries.slice(index).map((e) => this.format(e));
    const oldLength = oldTexts.reduce((total, current) => total + current.split('\n').length, 0);

    this.entries[index] = entry;
    const newTexts = this.entries.slice(index).map((e) => this.format(e));

    this.stream.write(cursorUp(oldLength));
    this.stream.write(cursorLeft);
    this.stream.write(newTexts.join('\n') + '\n');
    this.stream.write(eraseDown);

    return true;
  }

  private append(entry: JournalEntry): void {
    this.entries.push(entry);

    const text = this.format(entry);
    this.stream.write(text + '\n');
  }

  private format(entry: JournalEntry): string {
    const lines = [];

    const message = entry.message.trim();

    if (['prepare', 'start', 'success', 'failure'].includes(entry.type)) {
      const prefix = colorize(entry.type, statusSymbol(entry.type));
      lines.push(`${prefix} ${message}`);
    } else {
      lines.push(colorize(entry.type, message));
    }

    if (this.verbosity >= 3) {
      if (entry.meta && Object.values(entry.meta).length && Object.keys(entry.meta).length) {
        const yaml = YAML.stringify(entry.meta).trimEnd();
        lines.push(colorize('debug', `[Meta]\n${yaml}`));
      }
    }

    return lines.join('\n');
  }

  private async storeArtifacts(artifacts: File[]) {
    if (!this.artifactPath || artifacts.length === 0) return;

    for (const artifact of artifacts) {
      const data = await artifact.bytes();
      await this.writeFile(`${this.artifactPath}/${artifact.name}`, data);
    }
  }
}
