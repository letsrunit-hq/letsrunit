import type { Sink, JournalEntry } from '../types';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import YAML from 'yaml';

marked.use(markedTerminal());

interface CliSinkOptions {
  stream?: NodeJS.WriteStream;
  verbosity?: number;
}

function colorize(level: JournalEntry['level'], text: string): string {
  // ANSI escape codes: debug=bright black (gray), warn=yellow, error=red, info=no color
  switch (level) {
    case 'debug':
      return `\x1b[90m${text}\x1b[0m`;
    case 'warn':
      return `\x1b[33m${text}\x1b[0m`;
    case 'error':
      return `\x1b[31m${text}\x1b[0m`;
    case 'info':
    default:
      return text;
  }
}

export class CliSink implements Sink {
  public readonly stream: NodeJS.WriteStream;
  public readonly verbosity: number;

  constructor(options: CliSinkOptions = {}) {
    this.stream = options.stream ?? process.stdout;
    this.verbosity = options.verbosity ?? 1;
  }

  async publish(entry: JournalEntry): Promise<void> {
    if (entry.level === 'debug' && this.verbosity < 2) return;
    if (entry.level === 'info' && this.verbosity < 1) return;

    const rendered = (await marked(entry.message)).trim();
    const line = colorize(entry.level, rendered);
    this.stream.write(`${line}\n`);

    if (this.verbosity >= 3) {
      if (entry.artifacts?.length) {
        const list = entry.artifacts.map((a) => `- ${a}`).join('\n');
        this.stream.write(colorize('debug', `[Artifacts]\n${list}\n`));
      }
      if (entry.meta && Object.values(entry.meta).length && Object.keys(entry.meta).length) {
        const yaml = YAML.stringify(entry.meta).trimEnd();
        this.stream.write(colorize('debug', `[Meta]\n${yaml}\n`));
      }
    }
  }
}
