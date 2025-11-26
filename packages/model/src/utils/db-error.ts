import { PostgrestError } from '@supabase/postgrest-js';

export class DBError extends Error {
  constructor(
    readonly status: number,
    cause?: PostgrestError | null,
  ) {
    const message =
      status === 0 ? 'Failed to connected to Supabase' : (cause?.message ?? DBError.standardMessage(status));

    super(message, { cause });
    this.status = status;
  }

  private static standardMessage(status: number): string {
    switch (status) {
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      default:
        return 'Unknown error';
    }
  }
}
