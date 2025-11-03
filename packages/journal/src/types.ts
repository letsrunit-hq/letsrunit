export interface JournalEntry {
  timestamp: number;
  type: 'debug' | 'info' | 'title' | 'warn' | 'error' | 'prepare' | 'success' | 'failure';
  message: string;
  artifacts: string[];
  meta: Record<string, any>;
}

export interface Sink {
  publish(...entries: JournalEntry[]): Promise<void>
}
