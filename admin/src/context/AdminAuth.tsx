import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toE164 } from '../lib/format';

export interface AdminProfile {
  user_id: string;
  full_name: string | null;
  role: 'DRIVER' | 'SHIPPER' | 'ADMIN' | null;
  phone: string | null;
  email: string | null;
  verification_status: string | null;
}

interface AdminAuthState {
  loading: boolean;
  profile: AdminProfile | null;
  error: string | null;
  isAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

const loadProfile = async (userId: string): Promise<AdminProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, role, phone, email, verification_status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('profiles load error:', error.message);
    return null;
  }
  return (data as AdminProfile) || null;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const p = await loadProfile(data.user.id);
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setProfile(null);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void refresh();
    });
    return () => sub.data.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const id = identifier.trim();
      const credentials = id.includes('@')
        ? { email: id, password }
        : { phone: toE164(id), password };

      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError || !data.user) {
        throw new Error(signInError?.message || 'ورود ناموفق بود.');
      }

      const p = await loadProfile(data.user.id);
      if (!p) {
        await supabase.auth.signOut();
        throw new Error('پروفایل این حساب یافت نشد.');
      }
      if (p.role !== 'ADMIN') {
        await supabase.auth.signOut();
        throw new Error('این حساب دسترسی مدیریت ندارد.');
      }
      setProfile(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق بود.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      loading,
      profile,
      error,
      isAdmin: profile?.role === 'ADMIN',
      signIn,
      signOut,
      refresh,
    }),
    [loading, profile, error, signIn, signOut, refresh]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthState => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
};
