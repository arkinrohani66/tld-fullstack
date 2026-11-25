import { UserAccount, UserProfile, UserRole } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { SupabaseProfile } from './supabaseTypes';
import { authenticateWithBiometrics, getStoredCredentials } from '../utils/webAuthn';

const STORAGE_KEYS = {
  SESSION: 'tld_session_user',
  DRAFT_PROFILE: 'tld_profile_draft',
  ACCOUNTS_DB: 'tld_accounts_db',
  CURRENT_SCREEN: 'tld_current_screen',
};

const env = (import.meta as any).env || {};

/**
 * حالت توسعه: تا وقتی اپ به‌صورت dev اجرا می‌شود، اگر Supabase در دسترس نباشد
 * امکان ورود محلی (برای تست UI) وجود دارد. این مسیر در بیلد پروداکشن
 * (`import.meta.env.DEV === false`) کاملاً غیرفعال است، بنابراین کد تستی ۱۲۳۴
 * هرگز در نسخه نهایی قابل استفاده نیست.
 */
const DEV_AUTH_ALLOWED: boolean = Boolean(env.DEV) && env.VITE_ALLOW_DEV_AUTH !== 'false';
const DEV_OTP_CODE = '123456';

/** شماره موبایل را به قالب یکسان E.164 تبدیل می‌کند (کلید ذخیره‌سازی یکتا). */
export const toE164 = (mobile: string): string => {
  const raw = (mobile || '').trim();
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+98')) return digits;
  if (digits.startsWith('0098')) return `+98${digits.slice(4)}`;
  if (digits.startsWith('98') && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith('0')) return `+98${digits.slice(1)}`;
  if (digits.startsWith('+')) return digits;
  return `+98${digits}`;
};

const displayMobile = (mobile: string): string => {
  if (!mobile) return '';
  // ایمیل‌ها نباید به قالب شماره موبایل تبدیل شوند.
  if (mobile.includes('@')) return mobile;
  const e164 = toE164(mobile);
  return e164.startsWith('+98') ? `0${e164.slice(3)}` : mobile;
};

/** شناسه ورود: ایمیل یا شماره موبایل E.164 */
const normalizeIdentifier = (input: string): { isEmail: boolean; value: string } => {
  const raw = (input || '').trim();
  if (raw.includes('@')) return { isEmail: true, value: raw.toLowerCase() };
  return { isEmail: false, value: toE164(raw) };
};

const getStoredAccounts = (): Record<string, UserAccount> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_DB);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredAccounts = (accounts: Record<string, UserAccount>) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS_DB, JSON.stringify(accounts));
  } catch (e) {
    console.error('Storage error', e);
  }
};

const persistSession = (account: UserAccount) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(account));
    const accounts = getStoredAccounts();
    accounts[toE164(account.mobile)] = account;
    saveStoredAccounts(accounts);
  } catch (e) {
    console.error('Storage error', e);
  }
};

const requireClient = () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('اتصال به پایگاه داده پیکربندی نشده است.');
  }
  return client;
};

/** نسخه انسانی پیام‌های خطای Supabase Auth */
const authErrorMessage = (message: string, fallback: string): string => {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'شماره موبایل یا رمز عبور نادرست است.';
  if (m.includes('phone not confirmed')) return 'شماره موبایل تأیید نشده است؛ ابتدا کد پیامکی را وارد کنید.';
  if (m.includes('user already registered')) return 'این شماره موبایل قبلاً ثبت‌نام کرده است.';
  if (m.includes('password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  if (m.includes('token has expired') || m.includes('invalid token') || m.includes('otp_expired'))
    return 'کد تأیید نامعتبر یا منقضی شده است.';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'تعداد تلاش‌ها بیش از حد مجاز است؛ چند دقیقه دیگر دوباره امتحان کنید.';
  if (m.includes('sms') || m.includes('provider'))
    return 'ارسال پیامک در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید یا با پشتیبانی تماس بگیرید.';
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to fetch'))
    return 'ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید.';
  return fallback;
};

const accountFromProfile = (
  userId: string,
  mobile: string,
  profile: SupabaseProfile | null
): UserAccount => {
  const fullName = profile?.full_name || '';
  return {
    id: userId,
    mobile: displayMobile(mobile),
    role: (profile?.role as UserRole | undefined) ?? undefined,
    firstName: fullName ? fullName.split(' ')[0] : undefined,
    lastName: fullName ? fullName.split(' ').slice(1).join(' ') : undefined,
    profile: profile
      ? {
          fullName,
          nationalId: profile.national_id || '',
          email: profile.email,
          dob: profile.birth_date || '',
          province: profile.province,
          city: profile.city,
          postalCode: profile.postal_code,
          address: profile.address || '',
          // شناسه‌ها فقط از دیتابیس خوانده می‌شوند؛ ساخت شناسه جعلی در کلاینت باعث
          // می‌شد کد پیگیری نمایش‌داده‌شده به کاربر در سیستم وجود نداشته باشد.
          driverId: profile.driver_id || undefined,
          companyName: profile.company_name,
          fleetType: profile.fleet_type,
          truckModel: profile.truck_model,
          plateNumber: profile.plate_number,
          profileImage: profile.avatar_url,
        }
      : undefined,
    verificationStatus: (profile?.verification_status as UserAccount['verificationStatus']) || 'NOT_SUBMITTED',
    rejectionReason: profile?.rejection_reason,
    requestId: profile?.request_id || '—',
    createdAt: profile?.created_at || new Date().toISOString(),
  };
};

const loadProfile = async (userId: string): Promise<SupabaseProfile | null> => {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('profiles load error:', error.message);
    return null;
  }
  return (data as SupabaseProfile | null) ?? null;
};

const createDevAccount = (mobile: string): UserAccount =>
  ({
    id: `USR-${Date.now().toString().slice(-6)}`,
    mobile: displayMobile(mobile),
    role: undefined,
    firstName: '',
    lastName: '',
    profile: { fullName: '', nationalId: '', dob: '', address: '' },
    verificationStatus: 'NOT_SUBMITTED',
    requestId: '—',
    createdAt: new Date().toISOString(),
  }) as UserAccount;

export const authService = {
  /** آیا در حال حاضر جلسه معتبر Supabase داریم؟ (منبع حقیقت) */
  async hasLiveSession(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { data } = await client.auth.getUser();
      return Boolean(data?.user);
    } catch {
      return false;
    }
  },

  /** پروفایل را از دیتابیس می‌خواند و کش محلی را تازه می‌کند. */
  async refreshSession(): Promise<UserAccount | null> {
    if (!isSupabaseConfigured()) return this.getCurrentSession();
    try {
      const client = getSupabaseClient();
      if (!client) return null;
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) {
        // در محیط توسعه، نشست محلی (ورود آزمایشی) معتبر شناخته می‌شود؛ در بیلد
        // نهایی نه، چون یعنی توکن Supabase منقضی شده و باید دوباره وارد شد.
        if (DEV_AUTH_ALLOWED) return this.getCurrentSession();
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return null;
      }
      const profile = await loadProfile(data.user.id);
      const account = accountFromProfile(data.user.id, data.user.phone || data.user.email || '', profile);
      persistSession(account);
      return account;
    } catch (e) {
      console.warn('refreshSession failed:', e);
      return null;
    }
  },

  /** ورود با گوگل از طریق Supabase OAuth (یک سیستم احراز هویت واحد). */
  async loginWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('ورود با گوگل در این نسخه پیکربندی نشده است.');
    }
    const client = requireClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // مسیر بدون hash تا redirect_URI با تنظیمات Supabase مطابقت داشته باشد.
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}`
            : undefined,
      },
    });
    if (error) {
      throw new Error(error.message || 'ورود با گوگل ناموفق بود.');
    }
  },

  async sendOtp(mobile: string): Promise<{ success: boolean; message: string }> {
    const phone = toE164(mobile);
    if (!phone || phone.replace(/\D/g, '').length < 12) {
      throw new Error('شماره موبایل وارد شده معتبر نیست');
    }

    if (isSupabaseConfigured()) {
      const client = requireClient();
      const { error } = await client.auth.signInWithOtp({ phone });
      if (error) {
        throw new Error(authErrorMessage(error.message, 'ارسال کد یک‌بار مصرف ناموفق بود.'));
      }
      return { success: true, message: 'کد یک‌بار مصرف با موفقیت ارسال شد' };
    }

    if (!DEV_AUTH_ALLOWED) {
      throw new Error('سامانه ارسال پیامک پیکربندی نشده است.');
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, message: 'کد یک‌بار مصرف با موفقیت ارسال شد' };
  },

  async verifyOtp(mobile: string, code: string): Promise<UserAccount> {
    const phone = toE164(mobile);
    const token = (code || '').trim();

    if (isSupabaseConfigured()) {
      const client = requireClient();
      const { data, error } = await client.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error || !data?.user) {
        throw new Error(authErrorMessage(error?.message || '', 'کد تأیید وارد شده نامعتبر است'));
      }
      const profile = await loadProfile(data.user.id);
      const account = accountFromProfile(data.user.id, data.user.phone || phone, profile);
      persistSession(account);
      return account;
    }

    if (!DEV_AUTH_ALLOWED) {
      throw new Error('ورود با کد یک‌بار مصرف در این نسخه فعال نیست.');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (token !== DEV_OTP_CODE) {
      throw new Error('کد تأیید وارد شده نامعتبر است');
    }
    const accounts = getStoredAccounts();
    const user = accounts[phone] || createDevAccount(phone);
    persistSession(user);
    return user;
  },

  async login(mobile: string, password?: string): Promise<UserAccount> {
    const { isEmail, value } = normalizeIdentifier(mobile);
    if (!isEmail && (!value || value.replace(/\D/g, '').length < 12)) {
      throw new Error('شماره موبایل باید حداقل ۱۰ رقم باشد');
    }
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error('ایمیل وارد‌شده معتبر نیست');
    }

    if (isSupabaseConfigured()) {
      if (!password) {
        throw new Error('رمز عبور را وارد کنید.');
      }
      const client = requireClient();
      const credentials = isEmail
        ? { email: value, password }
        : { phone: value, password };
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error || !data?.user) {
        throw new Error(
          authErrorMessage(error?.message || '', 'شماره موبایل/ایمیل یا رمز عبور نادرست است.')
        );
      }
      const profile = await loadProfile(data.user.id);
      const account = accountFromProfile(data.user.id, data.user.phone || data.user.email || value, profile);
      persistSession(account);
      return account;
    }

    if (!DEV_AUTH_ALLOWED) {
      throw new Error('ورود به سامانه در این نسخه فعال نیست.');
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (!password || password.length < 6) {
      throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد');
    }
    const accounts = getStoredAccounts();
    const user = accounts[value] || createDevAccount(value);
    persistSession(user);
    return user;
  },

  async signup(data: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    password: string;
  }): Promise<UserAccount> {
    const phone = toE164(data.mobile);
    const email = (data.email || '').trim().toLowerCase();
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    if (!data.password || data.password.length < 6) {
      throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد');
    }

    if (isSupabaseConfigured()) {
      const client = requireClient();

      // ثبت‌نام با ایمیل زمانی که ایمیل داده شده، در غیر این صورت با موبایل.
      // (موبایل در Supabase فعلاً غیرفعال است و نیاز به سرویس پیامک دارد.)
      const credentials = email
        ? { email, password: data.password, options: { data: { full_name: fullName, phone } } }
        : { phone, password: data.password, options: { data: { full_name: fullName, email } } };

      const { data: signUpData, error } = await client.auth.signUp(credentials as any);

      if (error) {
        const raw = (error.message || '').toLowerCase();
        if (raw.includes('phone_provider_disabled') || raw.includes('phone signups are disabled')) {
          throw new Error(
            'ثبت‌نام با شماره موبایل هنوز فعال نشده است. لطفاً ایمیل خود را وارد کنید.'
          );
        }
        if (raw.includes('user already registered') || raw.includes('already been registered')) {
          throw new Error('این ایمیل قبلاً ثبت‌نام کرده است. وارد شوید یا رمز را بازیابی کنید.');
        }
        throw new Error(authErrorMessage(error.message, 'ایجاد حساب کاربری ناموفق بود.'));
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        throw new Error('ایجاد حساب کاربری ناموفق بود.');
      }

      const hasSession = Boolean(signUpData?.session);

      if (hasSession) {
        // ردیف پروفایل توسط تریگر handle_new_user ساخته می‌شود؛ اینجا فقط تکمیل می‌شود.
        const { error: profileError } = await client
          .from('profiles')
          .update({
            full_name: fullName,
            email: email || null,
            phone: phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (profileError) {
          console.warn('profiles update after signup failed:', profileError.message);
        }

        const profile = await loadProfile(userId);
        const account = accountFromProfile(
          userId,
          signUpData?.user?.phone || signUpData?.user?.email || email || phone,
          profile
        );
        persistSession(account);
        return account;
      }

      // بدون نشست یعنی پروژه روی «تأیید ایمیل» تنظیم است.
      throw new Error(
        'حساب ساخته شد ولی هنوز تأیید نشده است. لینک تأیید به ایمیل شما ارسال شد؛ پس از تأیید وارد شوید. (برای فعال‌سازی ورود فوری، در Supabase گزینه Confirm email را خاموش کنید.)'
      );
    }

    if (!DEV_AUTH_ALLOWED) {
      throw new Error('ثبت‌نام در این نسخه فعال نیست.');
    }

    const accounts = getStoredAccounts();
    const existing = accounts[phone];
    if (existing) {
      throw new Error('این شماره موبایل قبلاً ثبت‌نام کرده است.');
    }
    const newUser: UserAccount = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      mobile: displayMobile(phone),
      firstName: data.firstName,
      lastName: data.lastName,
      profile: {
        fullName,
        nationalId: '',
        email: data.email,
        dob: '',
        address: '',
      },
      verificationStatus: 'NOT_SUBMITTED',
      requestId: '—',
      createdAt: new Date().toISOString(),
    };
    persistSession(newUser);
    return newUser;
  },

  async updateRole(userId: string, role: UserRole): Promise<UserAccount> {
    if (isSupabaseConfigured()) {
      const client = requireClient();
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) {
        throw new Error('نشست شما منقضی شده است؛ دوباره وارد شوید.');
      }
      const { error: updateError } = await client
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('user_id', data.user.id);
      if (updateError) {
        throw new Error(updateError.message);
      }

      // ردیف drivers برای راننده لازم است، وگرنه درج پیشنهاد (cargo_bids) با خطای
      // foreign key شکست می‌خورد و راننده هرگز نمی‌تواند پیشنهاد بدهد.
      if (role === 'DRIVER') {
        const { error: driverError } = await client
          .from('drivers')
          .upsert({ profile_id: data.user.id }, { onConflict: 'profile_id' });
        if (driverError) {
          console.warn('drivers upsert on role select failed:', driverError.message);
        }
      }

      const profile = await loadProfile(data.user.id);
      const account = accountFromProfile(data.user.id, data.user.phone || '', profile);
      persistSession(account);
      return account;
    }

    const session = this.getCurrentSession();
    const user: UserAccount = session || createDevAccount('09120000000');
    user.role = role;
    persistSession(user);
    return user;
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<UserAccount> {
    if (isSupabaseConfigured()) {
      const client = requireClient();
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) {
        throw new Error('نشست شما منقضی شده است؛ دوباره وارد شوید.');
      }
      const uid = data.user.id;

      const { error: profileError } = await client
        .from('profiles')
        .update({
          full_name: profile.fullName,
          national_id: profile.nationalId,
          email: profile.email,
          birth_date: profile.dob,
          province: profile.province,
          city: profile.city,
          postal_code: profile.postalCode,
          address: profile.address,
          company_name: profile.companyName,
          fleet_type: profile.fleetType,
          truck_model: profile.truckModel,
          plate_number: profile.plateNumber,
          avatar_url: profile.profileImage,
          verification_status: 'PENDING',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', uid);

      if (profileError) {
        throw new Error(profileError.message);
      }

      const session = this.getCurrentSession();
      if (session?.role === 'DRIVER') {
        const { error: driverError } = await client.from('drivers').upsert(
          {
            profile_id: uid,
            truck_model: profile.truckModel,
            plate_number: profile.plateNumber,
            fleet_type: profile.fleetType,
          },
          { onConflict: 'profile_id' }
        );
        if (driverError) console.warn('drivers upsert failed:', driverError.message);
      } else if (session?.role === 'SHIPPER') {
        const { error: shipperError } = await client.from('shippers').upsert(
          {
            profile_id: uid,
            company_name: profile.companyName || 'شرکت تجاری',
          },
          { onConflict: 'profile_id' }
        );
        if (shipperError) console.warn('shippers upsert failed:', shipperError.message);
      }

      const freshProfile = await loadProfile(uid);
      const account = accountFromProfile(uid, data.user.phone || '', freshProfile);
      account.submittedAt = new Date().toISOString();
      persistSession(account);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_PROFILE);
      return account;
    }

    const session = this.getCurrentSession();
    const user: UserAccount = session || createDevAccount('09120000000');
    user.profile = profile;
    user.verificationStatus = 'PENDING';
    user.submittedAt = new Date().toISOString();
    persistSession(user);
    localStorage.removeItem(STORAGE_KEYS.DRAFT_PROFILE);
    return user;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserAccount> {
    if (isSupabaseConfigured()) {
      const client = requireClient();
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) {
        throw new Error('نشست شما منقضی شده است؛ دوباره وارد شوید.');
      }
      const { error: updateError } = await client
        .from('profiles')
        .update({
          full_name: updates.fullName,
          email: updates.email,
          birth_date: updates.dob,
          province: updates.province,
          city: updates.city,
          postal_code: updates.postalCode,
          address: updates.address,
          avatar_url: updates.profileImage,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.user.id);
      if (updateError) {
        throw new Error(updateError.message);
      }
      const profile = await loadProfile(data.user.id);
      const account = accountFromProfile(data.user.id, data.user.phone || '', profile);
      persistSession(account);
      return account;
    }

    const session = this.getCurrentSession();
    const user: UserAccount = session || createDevAccount('09120000000');
    user.profile = { ...(user.profile as UserProfile), ...updates } as UserProfile;
    persistSession(user);
    return user;
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    signOutOtherDevices?: boolean
  ): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('رمز عبور جدید باید حداقل ۸ کاراکتر باشد');
    }

    if (isSupabaseConfigured()) {
      const client = requireClient();
      const session = this.getCurrentSession();
      const ident = normalizeIdentifier(session?.mobile || '');

      // برای تغییر رمز، ابتدا رمز فعلی باید واقعاً تأیید شود.
      if (ident.value && currentPassword) {
        const creds = ident.isEmail
          ? { email: ident.value, password: currentPassword }
          : { phone: ident.value, password: currentPassword };
        const { error: reauthError } = await client.auth.signInWithPassword(creds);
        if (reauthError) {
          throw new Error('رمز عبور فعلی نادرست است.');
        }
      } else {
        throw new Error('برای تغییر رمز باید رمز عبور فعلی را وارد کنید.');
      }

      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(authErrorMessage(error.message, 'تغییر رمز عبور ناموفق بود.'));
      }

      if (signOutOtherDevices) {
        try {
          await client.auth.signOut({ scope: 'others' });
        } catch (err) {
          console.warn('Sign out other devices failed:', err);
        }
      }

      return {
        success: true,
        message: 'رمز عبور شما با موفقیت به‌روزرسانی شد.',
      };
    }

    return {
      success: true,
      message: 'رمز عبور شما با موفقیت تغییر یافت (حالت آزمایشی).',
    };
  },

  async loginWithBiometrics(username?: string): Promise<UserAccount> {
    if (!isSupabaseConfigured()) {
      throw new Error('ورود بیومتریک فقط در حالت اتصال به پایگاه داده فعال است.');
    }
    const creds = getStoredCredentials(username);
    if (creds.length === 0) {
      throw new Error(
        'هیچ کلید بیومتریکی برای ورود در این دستگاه یافت نشد. لطفاً ابتدا وارد شوید و اثر انگشت خود را ثبت نمایید.'
      );
    }

    const authResult = await authenticateWithBiometrics(username);
    if (!authResult.success) {
      throw new Error(authResult.error || 'احراز هویت بیومتریک توسط سیستم عامل تایید نشد.');
    }

    // پس از تأیید بیومتریک، هویت واقعی باید از Supabase خوانده شود؛
    // ساختن حساب APPROVED در کلاینت یک دور زدن کامل احراز هویت بود.
    const account = await this.refreshSession();
    if (!account) {
      throw new Error('نشست شما منقضی شده است؛ لطفاً با رمز عبور وارد شوید.');
    }
    persistSession(account);
    return account;
  },

  saveDraft(profile: Partial<UserProfile>): void {
    localStorage.setItem(STORAGE_KEYS.DRAFT_PROFILE, JSON.stringify(profile));
  },

  getDraft(): Partial<UserProfile> | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFT_PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getCurrentSession(): UserAccount | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    const client = getSupabaseClient();
    if (client) {
      void client.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.DRAFT_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS_DB);
  },
};
