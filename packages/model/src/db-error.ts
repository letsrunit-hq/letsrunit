import { PostgrestError } from '@supabase/postgrest-js';

export class DBError extends Error {
  constructor(status: number, cause: PostgrestError | null) {
    const message = status === 0 ? 'Failed to connected to Supabase' : cause?.message ?? 'Unknown error';
    super(message, { cause });
  }
}
