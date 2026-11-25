import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase bootstrap.
 *
 * The app must talk to exactly ONE project. Previously the `.env` file pointed to
 * `mxwfmynyvxnlthferxhs` while the fallbacks below pointed to
 * `axkujlcppxbngskebyjn`, so a build without env vars silently connected to a
 * different (empty) database. The fallbacks are now aligned with the project that
 * the migrations in `supabase/` were applied to.
 */
export const DEFAULT_SUPABASE_URL = 'https://xucsgbapstfcftwrurhy.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3NnYmFwc3RmY2Z0d3J1cmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5ODcyNTYsImV4cCI6MjEwOTU2MzI1Nn0.ErywlPc2YHL9x2pLu8qK3yoFDasVW3ABV4ejLYPsbZE';

const env = (import.meta as any).env || {};

const supabaseUrl: string = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const forceMock: boolean = env.VITE_USE_MOCK_DATA === 'true';

const PLACEHOLDER_VALUES = new Set([
  '',
  'your-anon-key',
  'MY_SUPABASE_ANON_KEY',
  'undefined',
  'null',
]);

export const getTargetSupabaseUrl = (): string => supabaseUrl;

export const isSupabaseConfigured = (): boolean => {
  if (forceMock) return false;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project')) return false;
  if (PLACEHOLDER_VALUES.has(supabaseAnonKey.trim())) return false;
  try {
    // Reject malformed URLs early instead of failing on every request.
    new URL(supabaseUrl);
  } catch {
    return false;
  }
  return true;
};

export const isMockMode = (): boolean => !isSupabaseConfigured();

let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Single shared client for the whole app. Creating a second client (as the old
 * code did in the `supabase` export) splits the auth session between two GoTrue
 * instances, which makes `auth.getUser()` return null in some modules.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'tld-auth-token',
      },
    });
  }
  return supabaseClientInstance;
};

/** @deprecated use getSupabaseClient() so every module shares one session. */
export const supabase = getSupabaseClient();
