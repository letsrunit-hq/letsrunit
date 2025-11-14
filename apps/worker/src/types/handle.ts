import type { SupabaseClient } from '@supabase/supabase-js';
import { Journal } from '@letsrunit/journal';

export interface HandleOptions {
  supabase: SupabaseClient;
  journal: Journal;
}
