export interface JournalEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  artifacts: string[];
  meta: Record<string, any>;
}
