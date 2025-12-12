import type { PostgrestError } from '@supabase/postgrest-js';

export class DBError extends Error {
  readonly status: number;

  constructor(status: number, cause?: PostgrestError | null) {
    const mappedStatus = DBError.mapStatus(status, cause);
    const message = DBError.messageFor(mappedStatus, cause);

    super(message, { cause: cause ?? undefined });

    this.name = 'DBError';
    this.status = mappedStatus;
  }

  private static mapStatus(status: number, cause?: PostgrestError | null): number {
    // PostgREST: .single() with 0 rows (or multiple rows) returns 406 + PGRST116
    if (status === 406 && cause?.code === 'PGRST116') return 404;

    // Network / fetch failure (Supabase often uses status 0)
    return status;
  }

  private static messageFor(status: number, cause?: PostgrestError | null): string {
    if (status === 0) return 'Failed to connect to Supabase';

    return cause?.message ?? DBError.standardMessage(status);
  }

  private static standardMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 429:
        return 'Too Many Requests';
      default:
        if (status >= 500) return 'Supabase error';
        return 'Unknown error';
    }
  }
}

export function maybe(e: unknown): Promise<null> {
  if (e instanceof DBError && e.status === 404) return Promise.resolve(null);
  return Promise.reject(e);
}
