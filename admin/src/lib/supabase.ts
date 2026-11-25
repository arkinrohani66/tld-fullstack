import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

/**
 * همان پروژه Supabase که اپ اصلی و مایگریشن‌ها به آن متصلاند.
 * اپ مدیریتی نباید بدون `.env` با آدرس/کلید خالی `createClient` را صدا بزند،
 * چون supabase-js در این حالت خطا میدهد و تمام پنل سفید میشود.
 * این مقادیر باید با DEFAULT_SUPABASE_URL / DEFAULT_SUPABASE_ANON_KEY
 * در `src/services/supabaseClient.ts` همگام باشند.
 */
const DEFAULT_SUPABASE_URL = 'https://xucsgbapstfcftwrurhy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3NnYmFwc3RmY2Z0d3J1cmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5ODcyNTYsImV4cCI6MjEwOTU2MzI1Nn0.ErywlPc2YHL9x2pLu8qK3yoFDasVW3ABV4ejLYPsbZE';

const PLACEHOLDER_KEYS = new Set(['', 'your-anon-key', 'MY_SUPABASE_ANON_KEY', 'undefined', 'null']);

const rawUrl: string = env.VITE_SUPABASE_URL || '';
const rawKey: string = env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_URL: string =
  rawUrl && !rawUrl.includes('your-project') ? rawUrl : DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string = PLACEHOLDER_KEYS.has(rawKey.trim())
  ? DEFAULT_SUPABASE_ANON_KEY
  : rawKey;

if (!rawUrl || !rawKey) {
  // eslint-disable-next-line no-console
  console.info(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY تعریف نشده است؛ از مقادیر پیشفرض همان پروژه اپ اصلی استفاده شد.'
  );
}

/**
 * اپ مدیریتی با همان کلید anon کار میکند؛ دسترسی ادمین از طریق
 * سیاستهای RLS و تابع is_admin() در دیتابیس کنترل میشود، نه در کلاینت.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'tld-admin-auth-token',
  },
});

export const isAdminEmail = (email?: string | null): boolean => Boolean(email);
