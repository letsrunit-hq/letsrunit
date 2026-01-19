import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    storage: {},
  })),
}));
