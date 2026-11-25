import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserProfile, UserRole, VerificationStatus } from '../types';
import { authService } from '../services/authService';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import {
  registerBiometricPasskey,
  removeStoredCredential,
  getStoredCredentials,
  BiometricCredential,
} from '../utils/webAuthn';

export interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  verificationStatus: VerificationStatus;
  isOffline: boolean;
  currentMobile: string;
  draftProfile: Partial<UserProfile> | null;
  toasts: ToastInfo[];
  hasBiometrics: boolean;
  setCurrentMobile: (mobile: string) => void;
  loginWithPassword: (mobile: string, password?: string) => Promise<UserAccount>;
  loginWithGoogle: () => Promise<void>;
  loginWithBiometrics: (mobile?: string) => Promise<UserAccount>;
  registerBiometrics: (displayName?: string, userRole?: UserRole) => Promise<BiometricCredential>;
  removeBiometrics: (id: string) => void;
  signup: (data: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    password: string;
  }) => Promise<UserAccount>;
  requestOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, code: string) => Promise<UserAccount>;
  selectRole: (role: UserRole) => Promise<UserAccount>;
  saveProfile: (profile: UserProfile) => Promise<UserAccount>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserAccount>;
  changePassword: (currentPassword: string, newPassword: string, signOutOtherDevices?: boolean) => Promise<{ success: boolean; message: string }>;
  saveDraft: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  toggleOfflineMode: () => void;
  showToast: (type: ToastInfo['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentSession());
  const [currentMobile, setCurrentMobile] = useState<string>(() => currentUser?.mobile || '');
  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile> | null>(() => authService.getDraft());
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(() => {
    return getStoredCredentials().length > 0;
  });

  // Keep biometric enrolled status in sync
  useEffect(() => {
    const creds = getStoredCredentials(currentUser?.mobile);
    setHasBiometrics(creds.length > 0);
  }, [currentUser]);

  // Source of truth: the Supabase session. A cached localStorage snapshot is only a
  // display cache; if there is no live session the user must sign in again, otherwise
  // every RLS-protected query silently returns an empty list and the app looks broken.
  useEffect(() => {
    let cancelled = false;
    const client = getSupabaseClient();

    if (isSupabaseConfigured()) {
      authService
        .refreshSession()
        .then((fresh) => {
          if (cancelled) return;
          if (fresh) {
            setCurrentUser(fresh);
            setCurrentMobile(fresh.mobile);
          } else {
            setCurrentUser(null);
            try {
              localStorage.removeItem('tld_current_screen');
            } catch {}
          }
        })
        .catch(() => {});
    }

    const subscription = client?.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('info', 'اتصال شبکه مجدداً برقرار شد.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('warning', 'اتصال اینترنت قطع شد. در حال کار در حالت آفلاین هستید.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (type: ToastInfo['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleOfflineMode = () => {
    setIsOffline((prev) => {
      const next = !prev;
      showToast(next ? 'warning' : 'success', next ? 'حالت شبیه‌سازی آفلاین فعال شد' : 'اتصال برقرار شد');
      return next;
    });
  };

  const checkConnectivity = () => {
    if (isOffline) {
      throw new Error('عدم دسترسی به شبکه: لطفاً اتصال اینترنت خود را بررسی نمایید.');
    }
  };

  const loginWithPassword = async (mobile: string, password?: string): Promise<UserAccount> => {
    checkConnectivity();
    const user = await authService.login(mobile, password);
    setCurrentUser(user);
    setCurrentMobile(user.mobile);
    showToast('success', 'ورود با موفقیت انجام شد');
    return user;
  };

  const loginWithGoogle = async () => {
    checkConnectivity();
    // Supabase خودش ریدایرکت را انجام میدهد؛ اینجا نباید navigate کنیم.
    await authService.loginWithGoogle();
  };

  const loginWithBiometrics = async (mobile?: string) => {
    const user = await authService.loginWithBiometrics(mobile);
    setCurrentUser(user);
    setCurrentMobile(user.mobile);
    setHasBiometrics(true);
    showToast('success', `ورود بیومتریک تایید شد. خوش آمدید، ${user.profile?.fullName || user.mobile}`);
    return user;
  };

  const registerBiometrics = async (displayName?: string, userRole?: UserRole) => {
    const targetMobile = currentUser?.mobile || currentMobile;
    if (!targetMobile) {
      throw new Error('شماره موبایل جهت ثبت بیومتریک مشخص نیست');
    }
    const name = displayName || currentUser?.profile?.fullName || (userRole === 'SHIPPER' ? 'صاحب بار' : 'راننده ناوگان');
    const role = userRole || currentUser?.role || 'DRIVER';
    const res = await registerBiometricPasskey(targetMobile, name, role);
    if (!res.success || !res.credential) {
      throw new Error(res.error || 'خطا در ثبت کلید بیومتریک');
    }
    setHasBiometrics(true);
    showToast('success', 'حسگر بیومتریک با استاندارد FIDO2 با موفقیت به حساب شما متصل گردید.');
    return res.credential;
  };

  const removeBiometrics = (id: string) => {
    removeStoredCredential(id);
    const updated = getStoredCredentials(currentUser?.mobile);
    setHasBiometrics(updated.length > 0);
    showToast('info', 'کلید بیومتریک با موفقیت حذف گردید.');
  };

  const signup = async (data: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    password: string;
  }): Promise<UserAccount> => {
    checkConnectivity();
    const user = await authService.signup(data);
    setCurrentUser(user);
    setCurrentMobile(user.mobile);
    showToast('success', 'حساب کاربری با موفقیت ایجاد شد');
    return user;
  };

  const requestOtp = async (mobile: string) => {
    checkConnectivity();
    await authService.sendOtp(mobile);
    setCurrentMobile(mobile);
    showToast('info', `کد تأیید برای ${mobile} ارسال گردید.`);
  };

  const verifyOtp = async (mobile: string, code: string): Promise<UserAccount> => {
    checkConnectivity();
    const user = await authService.verifyOtp(mobile, code);
    setCurrentUser(user);
    setCurrentMobile(user.mobile);
    showToast('success', 'احراز هویت با موفقیت انجام شد.');
    return user;
  };

  const selectRole = async (selectedRole: UserRole): Promise<UserAccount> => {
    checkConnectivity();
    const userId = currentUser?.id || '';
    const updated = await authService.updateRole(userId, selectedRole);
    setCurrentUser(updated);
    setCurrentMobile(updated.mobile);
    const roleLabel = selectedRole === 'DRIVER' ? 'راننده' : 'صاحب بار';
    showToast('success', `نقش ${roleLabel} انتخاب شد.`);
    return updated;
  };

  const saveProfile = async (profile: UserProfile): Promise<UserAccount> => {
    checkConnectivity();
    const userId = currentUser?.id || '';
    const updated = await authService.saveProfile(userId, profile);
    setCurrentUser(updated);
    setCurrentMobile(updated.mobile);
    setDraftProfile(null);
    showToast('success', 'اطلاعات پروفایل با موفقیت ثبت شد.');
    return updated;
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserAccount> => {
    checkConnectivity();
    const userId = currentUser?.id || '';
    const updated = await authService.updateProfile(userId, updates);
    setCurrentUser(updated);
    setCurrentMobile(updated.mobile);
    showToast('success', 'تغییرات پروفایل با موفقیت در سیستم ثبت گردید.');
    return updated;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    signOutOtherDevices?: boolean
  ) => {
    checkConnectivity();
    const userId = currentUser?.id || '';
    const res = await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
      signOutOtherDevices
    );
    showToast('success', res.message);
    return res;
  };

  const saveDraft = (profile: Partial<UserProfile>) => {
    authService.saveDraft(profile);
    setDraftProfile(profile);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    showToast('info', `پیش‌نویس در ساعت ${time} ذخیره شد`);
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('info', 'از حساب کاربری خارج شدید.');
  };

  const role = currentUser?.role || null;
  const verificationStatus = currentUser?.verificationStatus || 'NOT_SUBMITTED';
  const isAuthenticated = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        role,
        verificationStatus,
        isOffline,
        currentMobile,
        draftProfile,
        toasts,
        hasBiometrics,
        setCurrentMobile,
        loginWithPassword,
        loginWithGoogle,
        loginWithBiometrics,
        registerBiometrics,
        removeBiometrics,
        signup,
        requestOtp,
        verifyOtp,
        selectRole,
        saveProfile,
        updateProfile,
        changePassword,
        saveDraft,
        logout,
        toggleOfflineMode,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
