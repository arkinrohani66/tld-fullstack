import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const DEFAULT_SUPABASE_URL = 'https://pignzsgzhqgyfravucyz.supabase.co';
export { DEFAULT_SUPABASE_URL };

const supabaseUrl: string = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const SUPABASE_ANON_KEY = supabaseAnonKey;
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
