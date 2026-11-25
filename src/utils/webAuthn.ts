/**
 * Web Authentication API (WebAuthn / FIDO2 / Passkeys) Utility
 * Supports Biometric Authentication (Fingerprint / Touch ID / Face ID / Windows Hello)
 * Tailored for Drivers (Fleet Truckers) and Shippers (Cargo Owners) on mobile devices and desktops.
 * Includes resilient fallbacks for sandboxed iframe environments.
 */

import type { UserRole } from '../types';

export interface BiometricCredential {
  id: string;
  rawId: string;
  userName: string;
  displayName: string;
  userRole: UserRole;
  userHandle: string;
  createdAt: string;
  lastUsedAt?: string;
  deviceLabel: string;
  authenticatorType: 'platform' | 'security_key' | 'simulated';
}

const STORAGE_KEY = 'tld_webauthn_credentials';

/**
 * Base64URL Encoding & Decoding helpers for WebAuthn binary buffers
 */
export const bufferToBase64URL = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const base64URLToBuffer = (base64url: string): ArrayBuffer => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Detect hardware device and platform biometric sensor name
 */
export const getPlatformSensorDescription = (): { label: string; type: 'FINGERPRINT' | 'FACE_ID' | 'GENERIC' } => {
  if (typeof navigator === 'undefined') return { label: 'سنسور بیومتریک', type: 'GENERIC' };

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh/i.test(ua);
  const isWindows = /Windows/i.test(ua);

  if (isIOS) {
    return { label: 'شناسه چهره یا اثر انگشت اپل (Face ID / Touch ID)', type: 'FACE_ID' };
  }
  if (isAndroid) {
    return { label: 'سنسور اثر انگشت اندروید (Android Biometrics)', type: 'FINGERPRINT' };
  }
  if (isMac) {
    return { label: 'حسگر تاچ‌آیدی مک (Mac Touch ID)', type: 'FINGERPRINT' };
  }
  if (isWindows) {
    return { label: 'سنسور اثر انگشت یا چهره (Windows Hello)', type: 'GENERIC' };
  }
  return { label: 'سنسور بیومتریک سخت‌افزاری دستگاه', type: 'FINGERPRINT' };
};

/**
 * Check if WebAuthn and Platform Authenticator (Fingerprint / Face ID) are available
 */
export const isWebAuthnAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch (err) {
    console.warn('WebAuthn platform check error:', err);
    return false;
  }
};

/**
 * Retrieve stored credentials from localStorage
 */
export const getStoredCredentials = (username?: string): BiometricCredential[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: BiometricCredential[] = JSON.parse(raw);
    if (username) {
      const cleanTarget = username.replace(/\s+/g, '').toLowerCase();
      return list.filter((c) => c.userName.replace(/\s+/g, '').toLowerCase() === cleanTarget);
    }
    return list;
  } catch (err) {
    console.error('Failed to load biometric credentials:', err);
    return [];
  }
};

export const hasEnrolledBiometrics = (username?: string): boolean => {
  return getStoredCredentials(username).length > 0;
};

/**
 * Save a new or updated credential
 */
export const saveCredential = (cred: BiometricCredential) => {
  try {
    const existing = getStoredCredentials();
    const updated = [
      cred,
      ...existing.filter((c) => c.id !== cred.id && c.userName !== cred.userName),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save biometric credential:', err);
  }
};

/**
 * Update the lastUsedAt timestamp on a credential
 */
export const touchCredential = (id: string) => {
  try {
    const existing = getStoredCredentials();
    const updated = existing.map((c) =>
      c.id === id ? { ...c, lastUsedAt: new Date().toISOString() } : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to touch biometric credential:', err);
  }
};

/**
 * Remove a specific credential
 */
export const removeStoredCredential = (id: string) => {
  try {
    const existing = getStoredCredentials();
    const filtered = existing.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove biometric credential:', err);
  }
};

/**
 * Clear all stored biometric credentials
 */
export const clearAllCredentials = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear credentials:', err);
  }
};

/**
 * Register a biometric credential using navigator.credentials.create
 * Enhances security for drivers and shippers on mobile devices
 */
export const registerBiometricPasskey = async (
  username: string,
  displayName: string,
  userRole: UserRole = 'DRIVER'
): Promise<{
  success: boolean;
  credential?: BiometricCredential;
  simulated?: boolean;
  message?: string;
  error?: string;
}> => {
  const cleanUsername = username.replace(/\s+/g, '');
  if (!cleanUsername) {
    return { success: false, error: 'شناسه کاربری یا شماره موبایل الزامی است' };
  }

  const sensorInfo = getPlatformSensorDescription();
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const userIdBuffer = new TextEncoder().encode(cleanUsername);

  // Relying Party identifier (hostname)
  const rpId = window.location.hostname || 'localhost';

  const creationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'سامانه حمل و نقل و لجستیک TLD',
      id: rpId,
    },
    user: {
      id: userIdBuffer,
      name: cleanUsername,
      displayName: displayName || cleanUsername,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256 (P-256 with SHA-256)
      { alg: -257, type: 'public-key' },  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Built-in Touch ID, Face ID, or mobile fingerprint
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    if (navigator.credentials && navigator.credentials.create) {
      const cred = (await navigator.credentials.create({
        publicKey: creationOptions,
      })) as PublicKeyCredential | null;

      if (cred) {
        const rawIdBase64 = bufferToBase64URL(cred.rawId);
        const savedCred: BiometricCredential = {
          id: cred.id,
          rawId: rawIdBase64,
          userName: cleanUsername,
          displayName: displayName || cleanUsername,
          userRole,
          userHandle: cleanUsername,
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          deviceLabel: sensorInfo.label,
          authenticatorType: 'platform',
        };
        saveCredential(savedCred);
        return {
          success: true,
          credential: savedCred,
          simulated: false,
          message: 'کلید بیومتریک سخت‌افزاری با استاندارد FIDO2 با موفقیت فعال شد.',
        };
      }
    }
    throw new Error('سیستم بیومتریک مقداری برنگرداند');
  } catch (err: unknown) {
    console.warn('Native WebAuthn create failed:', err);

    // در محیط توسعه (iframe/preview بدون دسترسی به حسگر) یک اعتبارنامه شبیه‌سازی‌شده
    // ذخیره می‌شود تا تست UI ممکن باشد؛ در نسخه نهایی اما هرگز موفقیت جعلی
    // گزارش نمی‌شود، چون کاربر فکر می‌کرد بیومتریک فعال شده و بعداً قفل می‌شد.
    if ((import.meta as any).env?.DEV) {
      const mockId = `bio_tld_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const savedCred: BiometricCredential = {
        id: mockId,
        rawId: btoa(mockId),
        userName: cleanUsername,
        displayName: displayName || cleanUsername,
        userRole,
        userHandle: cleanUsername,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        deviceLabel: `${sensorInfo.label} (حالت شبیه‌سازی توسعه)`,
        authenticatorType: 'simulated',
      };
      saveCredential(savedCred);
      return {
        success: true,
        credential: savedCred,
        simulated: true,
        message: 'کلید بیومتریک شبیه‌سازی‌شده (فقط محیط توسعه) ثبت شد.',
      };
    }

    return {
      success: false,
      error:
        'ثبت کلید بیومتریک در این مرورگر/دستگاه ممکن نشد. از سیستم‌عامل و مرورگری استفاده کنید که WebAuthn را پشتیبانی می‌کند.',
    };
  }
};

/**
 * Authenticate using navigator.credentials.get
 * Verifies fingerprint or Face ID for drivers and shippers
 */
export const authenticateWithBiometrics = async (
  username?: string
): Promise<{
  success: boolean;
  credential?: BiometricCredential;
  simulated?: boolean;
  error?: string;
}> => {
  const allCreds = getStoredCredentials();
  if (allCreds.length === 0) {
    return {
      success: false,
      error: 'هیچ کلید بیومتریکی (اثر انگشت یا چهره) روی این دستگاه ثبت نشده است.',
    };
  }

  let targetCreds = allCreds;
  if (username && username.trim()) {
    const cleanUsername = username.replace(/\s+/g, '').toLowerCase();
    targetCreds = allCreds.filter(
      (c) => c.userName.replace(/\s+/g, '').toLowerCase() === cleanUsername
    );
    if (targetCreds.length === 0) {
      return {
        success: false,
        error: `کلید بیومتریکی برای شماره یا حساب ${username} یافت نشد. لطفاً ابتدا اثر انگشت را ثبت کنید.`,
      };
    }
  }

  const primaryCred = targetCreds[0];
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const allowCredentials: PublicKeyCredentialDescriptor[] = targetCreds.map((c) => {
    let idBuffer: ArrayBuffer;
    try {
      idBuffer = base64URLToBuffer(c.rawId);
    } catch {
      idBuffer = new TextEncoder().encode(c.id).buffer as ArrayBuffer;
    }
    return {
      id: idBuffer,
      type: 'public-key',
      transports: ['internal'],
    };
  });

  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials,
    userVerification: 'required',
    timeout: 60000,
    rpId: window.location.hostname || 'localhost',
  };

  try {
    if (navigator.credentials && navigator.credentials.get) {
      const assertion = await navigator.credentials.get({
        publicKey: requestOptions,
      });

      if (assertion) {
        touchCredential(primaryCred.id);
        return { success: true, credential: primaryCred, simulated: false };
      }
    }
    throw new Error('WebAuthn assertion null');
  } catch (err: unknown) {
    // Security: a cancelled or failed biometric verification must never grant access
    console.warn('Native WebAuthn verification failed (sandbox or user cancel):', err);
    return {
      success: false,
      credential: undefined,
      simulated: false,
      error: 'احراز هویت بیومتریک کامل نشد. لطفاً دوباره تلاش کنید یا از روش دیگری وارد شوید.',
    };
  }
};
