import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { AppScreen } from './types';
import { getTargetSupabaseUrl } from './services/supabaseClient';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { ToastContainer } from './components/ui/ToastContainer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { authService } from './services/authService';

// Phase 1 Authentication & Onboarding Screens
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { LanguageScreen } from './screens/LanguageScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { OtpScreen } from './screens/OtpScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { DriverRegistrationScreen } from './screens/driver-registration/DriverRegistrationScreen';
import { ShipperRegistrationScreen } from './screens/shipper-registration/ShipperRegistrationScreen';
import { VerificationStatusScreen } from './screens/VerificationStatusScreen';

// Phase 2A Core Operational Screens (Stitch 15 - 20)
import { DriverDashboardScreen } from './screens/DriverDashboardScreen';
import { ShipperDashboardScreen } from './screens/ShipperDashboardScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { NotificationDetailScreen } from './screens/NotificationDetailScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { ChatScreen } from './screens/ChatScreen';

// Section B: Dedicated Driver Flow Screens
import { DriverVehicleScreen } from './screens/DriverVehicleScreen';
import { DriverBidsScreen } from './screens/DriverBidsScreen';
import { DriverActiveTripScreen } from './screens/DriverActiveTripScreen';
import { DriverTripHistoryScreen } from './screens/DriverTripHistoryScreen';
import { DriverEarningsScreen } from './screens/DriverEarningsScreen';
import { DriverRatingsScreen } from './screens/DriverRatingsScreen';
import { DriverDisputesScreen } from './screens/DriverDisputesScreen';

// Section C: Dedicated Shipper Flow Screens (Full Lifecycle)
import { ShipperCreateCargoScreen } from './screens/ShipperCreateCargoScreen';
import { ShipperActiveCargosScreen } from './screens/ShipperActiveCargosScreen';
import { ShipperPastCargosScreen } from './screens/ShipperPastCargosScreen';
import { ShipperBidsScreen } from './screens/ShipperBidsScreen';
import { ShipperContractScreen } from './screens/ShipperContractScreen';
import { ShipperEscrowScreen } from './screens/ShipperEscrowScreen';
import { ShipperTrackingScreen } from './screens/ShipperTrackingScreen';
import { ShipperDeliveryConfirmScreen } from './screens/ShipperDeliveryConfirmScreen';
import { ShipperInvoiceScreen } from './screens/ShipperInvoiceScreen';
import { ShipperRatingScreen } from './screens/ShipperRatingScreen';
import { ShipperDisputesScreen } from './screens/ShipperDisputesScreen';

// Enterprise & Advanced Operational Modules
import { DriverBackhaulScreen } from './screens/DriverBackhaulScreen';
import { RMTOWaybillScreen } from './screens/RMTOWaybillScreen';

// Connected Logistics Modules
import { CargosScreen } from './screens/CargosScreen';
import { TripsScreen } from './screens/TripsScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { ChangePasswordScreen } from './screens/ChangePasswordScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    role,
    currentUser,
    verificationStatus,
    toasts,
    removeToast,
    showToast,
  } = useAuth();
  const { dir, trText } = useLanguage();
  const { isLiveSupabase } = useLogistics();

// Helper to resolve screen identifier from window.location.hash safely
const parseScreenFromHash = (): AppScreen | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase() as AppScreen;
  const allScreens: AppScreen[] = [
    'SPLASH', 'ONBOARDING', 'LANGUAGE', 'LOGIN', 'SIGNUP', 'FORGOT_PASSWORD', 'RESET_PASSWORD', 'OTP',
    'ROLE_SELECTION', 'DRIVER_REGISTRATION', 'SHIPPER_REGISTRATION', 'VERIFICATION_STATUS', 'DRIVER_DASHBOARD',
    'DRIVER_VEHICLE', 'DRIVER_BIDS', 'DRIVER_ACTIVE_TRIP', 'DRIVER_TRIP_HISTORY', 'DRIVER_EARNINGS',
    'DRIVER_RATINGS', 'DRIVER_DISPUTES', 'DRIVER_BACKHAUL', 'RMTO_WAYBILL_VERIFY',
    'SHIPPER_DASHBOARD', 'SHIPPER_CREATE_CARGO', 'SHIPPER_ACTIVE_CARGOS', 'SHIPPER_BIDS', 'SHIPPER_CONTRACT',
    'SHIPPER_ESCROW', 'SHIPPER_TRACKING', 'SHIPPER_DELIVERY_CONFIRM', 'SHIPPER_INVOICE', 'SHIPPER_RATING',
    'SHIPPER_PAST_CARGOS', 'SHIPPER_DISPUTES', 'NOTIFICATIONS',
    'NOTIFICATION_DETAIL', 'MESSAGES', 'CHAT', 'PROFILE', 'EDIT_PROFILE', 'CHANGE_PASSWORD', 'SETTINGS',
    'CARGOS', 'TRIPS', 'WALLET',
    'TRANSACTIONS', 'ADMIN_DASHBOARD'
  ];
  if (allScreens.includes(upper)) {
    return upper;
  }
  return null;
};

  // Initialize screen state with bulletproof persistence across reloads and mobile gestures
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    try {
      // 1. Direct URL hash takes highest precedence (#cargos, #driver_bids, #trips, etc.)
      const fromHash = parseScreenFromHash();
      if (fromHash) return fromHash;

      // 2. Saved persistent screen in localStorage (prevent reset to splash on reload)
      const saved = localStorage.getItem('tld_current_screen') as AppScreen | null;
      if (saved && saved !== 'SPLASH') {
        return saved;
      }
    } catch {}

    // 3. User session role fallback
    const session = authService.getCurrentSession();
    if (session) {
      if (session.role === 'SHIPPER') return 'SHIPPER_DASHBOARD';
      if (session.role === 'DRIVER') return 'DRIVER_DASHBOARD';
      return 'ROLE_SELECTION';
    }

    return 'SPLASH';
  });

  // Synchronize hash navigation across entire app lifetime
  useEffect(() => {
    const handleHashChange = () => {
      const fromHash = parseScreenFromHash();
      if (fromHash && fromHash !== currentScreen) {
        setCurrentScreen(fromHash);
        try {
          localStorage.setItem('tld_current_screen', fromHash);
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentScreen]);

  // Synchronize screen state with Auth state transitions safely without hijacking user navigation
  useEffect(() => {
    if (isAuthenticated) {
      const authScreens: AppScreen[] = [
        'SPLASH',
        'ONBOARDING',
        'LANGUAGE',
        'LOGIN',
        'SIGNUP',
        'OTP',
        'FORGOT_PASSWORD',
        'RESET_PASSWORD',
      ];
      if (authScreens.includes(currentScreen)) {
        let target: AppScreen = 'ROLE_SELECTION';
        if (role === 'ADMIN') target = 'ADMIN_DASHBOARD';
        else if (role === 'SHIPPER') target = 'SHIPPER_DASHBOARD';
        else if (role === 'DRIVER') target = 'DRIVER_DASHBOARD';
        setCurrentScreen(target);
        try {
          localStorage.setItem('tld_current_screen', target);
        } catch {}
      }
    }
  }, [isAuthenticated, role]);

  // Reference to track last back press timestamp for double-tap back exit protection
  const lastBackPressRef = React.useRef<number>(0);

  // Initialize browser history entry on initial mount
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.screen) {
        window.history.replaceState({ screen: currentScreen }, '', `#${currentScreen.toLowerCase()}`);
      }
    } catch {}
  }, []);

  // Handle hardware / browser popstate (Back button on mobile phone) without dropping out
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetScreen = (event.state && event.state.screen) || parseScreenFromHash();
      if (targetScreen) {
        setCurrentScreen(targetScreen);
        try {
          localStorage.setItem('tld_current_screen', targetScreen);
        } catch {}
        return;
      }

      // If popped back to an empty state or external boundary:
      const isDashboard = currentScreen === 'DRIVER_DASHBOARD' || currentScreen === 'SHIPPER_DASHBOARD' || currentScreen === 'ADMIN_DASHBOARD';
      const isInitialAuth = currentScreen === 'LOGIN' || currentScreen === 'SPLASH' || currentScreen === 'ONBOARDING';

      if (!isDashboard && !isInitialAuth) {
        // Safe return to dashboard instead of kicking user out of app
        const fallback: AppScreen = role === 'ADMIN' ? 'ADMIN_DASHBOARD' : role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';
        setCurrentScreen(fallback);
        try {
          localStorage.setItem('tld_current_screen', fallback);
          window.history.pushState({ screen: fallback }, '', `#${fallback.toLowerCase()}`);
        } catch {}
      } else if (isDashboard) {
        // Prevent accidental closing of app on mobile
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Allowed exit if user deliberately taps twice within 2 seconds
          return;
        }
        lastBackPressRef.current = now;
        try {
          window.history.pushState({ screen: currentScreen }, '', `#${currentScreen.toLowerCase()}`);
        } catch {}
        showToast('info', 'برای خروج از برنامه، یک بار دیگر دکمه بازگشت را بزنید.');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen, role, showToast]);

  const handleNavigate = (screen: AppScreen) => {
    setCurrentScreen(screen);
    try {
      localStorage.setItem('tld_current_screen', screen);
      window.history.pushState({ screen }, '', `#${screen.toLowerCase()}`);
    } catch {}
  };

  const PUBLIC_SCREENS: AppScreen[] = [
    'SPLASH',
    'ONBOARDING',
    'LANGUAGE',
    'LOGIN',
    'SIGNUP',
    'FORGOT_PASSWORD',
    'RESET_PASSWORD',
    'OTP',
  ];

  const resolveDashboard = (): AppScreen => {
    const session = authService.getCurrentSession();
    if (session?.role === 'ADMIN') return 'ADMIN_DASHBOARD';
    if (session?.role === 'SHIPPER') return 'SHIPPER_DASHBOARD';
    if (session?.role === 'DRIVER') return 'DRIVER_DASHBOARD';
    return 'ROLE_SELECTION';
  };

  const renderScreen = () => {
    // Route guard: any non-public screen requires an authenticated session.
    // Without this, `#admin_dashboard` in the URL opened the admin panel for guests.
    if (!isAuthenticated && !PUBLIC_SCREENS.includes(currentScreen)) {
      return (
        <LoginScreen
          onLoginSuccess={() => handleNavigate(resolveDashboard())}
          onRequestOtp={() => handleNavigate('OTP')}
          onForgotPassword={() => handleNavigate('FORGOT_PASSWORD')}
          onCreateAccount={() => handleNavigate('SIGNUP')}
        />
      );
    }

    if (currentScreen === 'ADMIN_DASHBOARD' && role !== 'ADMIN') {
      return (
        <div dir={dir} className="min-h-screen flex items-center justify-center p-6 bg-[#fbf8ff]">
          <div className="bg-white border border-[#c4c5da] rounded-2xl p-8 max-w-md text-center space-y-3">
            <span className="material-symbols-outlined text-[#ba1a1a] text-4xl">lock</span>
            <h2 className="font-bold text-lg">
              {trText('دسترسی غیرمجاز', 'Access denied', 'Erişim reddedildi')}
            </h2>
            <p className="text-sm text-[#545f72]">
              {trText(
                'این بخش فقط برای مدیران سامانه در دسترس است.',
                'This area is available only to platform administrators.',
                'Bu alan yalnızca platform yöneticilerine açıktır.'
              )}
            </p>
            <button
              onClick={() => handleNavigate(resolveDashboard())}
              className="bg-[#00258e] text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              {trText('بازگشت به داشبورد', 'Back to dashboard', 'Panele dön')}
            </button>
          </div>
        </div>
      );
    }

    switch (currentScreen) {
      case 'SPLASH':
        return (
          <SplashScreen
            onStart={() => {
              const fromHash = parseScreenFromHash();
              if (fromHash && fromHash !== 'SPLASH') {
                handleNavigate(fromHash);
                return;
              }
              const saved = localStorage.getItem('tld_current_screen') as AppScreen | null;
              if (saved && saved !== 'SPLASH') {
                handleNavigate(saved);
                return;
              }
              if (isAuthenticated) {
                handleNavigate(role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD');
              } else {
                handleNavigate('ONBOARDING');
              }
            }}
          />
        );

      case 'ONBOARDING':
        return (
          <OnboardingScreen
            onComplete={() => handleNavigate('LANGUAGE')}
            onSkip={() => handleNavigate('LANGUAGE')}
          />
        );

      case 'LANGUAGE':
        return <LanguageScreen onContinue={() => handleNavigate('LOGIN')} />;

      case 'LOGIN':
        return (
          <LoginScreen
            onLoginSuccess={() => handleNavigate(resolveDashboard())}
            onRequestOtp={() => handleNavigate('OTP')}
            onForgotPassword={() => handleNavigate('FORGOT_PASSWORD')}
            onCreateAccount={() => handleNavigate('SIGNUP')}
          />
        );

      case 'SIGNUP':
        // ثبت‌نام عمومی موقتاً بسته است؛ حساب‌ها توسط مدیر ساخته می‌شوند.
        return (
          <div dir={dir} className="min-h-screen flex items-center justify-center p-6 bg-[#fbf8ff]">
            <div className="bg-white border border-[#c4c5da] rounded-2xl p-8 max-w-md text-center space-y-3">
              <span className="material-symbols-outlined text-[#00258e] text-4xl">lock_person</span>
              <h2 className="font-bold text-lg">
                {trText('ثبت‌نام آنلاین فعلاً بسته است', 'Online sign-up is currently closed', 'Çevrimiçi kayıt şu anda kapalı')}
              </h2>
              <p className="text-sm text-[#545f72] leading-6">
                {trText(
                  'برای دریافت حساب کاربری با پشتیبانی TLD تماس بگیرید تا حساب شما ساخته شود.',
                  'To get an account, contact TLD support and we will create it for you.',
                  'Hesap almak için TLD desteğiyle iletişime geçin, hesabınızı oluşturalım.'
                )}
              </p>
              <button
                onClick={() => handleNavigate('LOGIN')}
                className="bg-[#00258e] text-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                {trText('بازگشت به ورود', 'Back to sign in', 'Girişe dön')}
              </button>
            </div>
          </div>
        );

      case 'FORGOT_PASSWORD':
        return (
          <ForgotPasswordScreen
            onSubmitSuccess={() => handleNavigate('RESET_PASSWORD')}
            onBackToLogin={() => handleNavigate('LOGIN')}
          />
        );

      case 'RESET_PASSWORD':
        return (
          <ResetPasswordScreen
            onSuccess={() => handleNavigate('LOGIN')}
          />
        );

      case 'OTP':
        return (
          <OtpScreen
            onVerificationSuccess={() => handleNavigate(resolveDashboard())}
            onChangeNumber={() => handleNavigate('LOGIN')}
          />
        );

      case 'ROLE_SELECTION':
        return (
          <RoleSelectionScreen
            onRoleSelected={(selectedRole) => {
              if (selectedRole === 'DRIVER') {
                handleNavigate('DRIVER_REGISTRATION');
              } else {
                handleNavigate('SHIPPER_REGISTRATION');
              }
            }}
          />
        );

      case 'DRIVER_REGISTRATION':
        return (
          <DriverRegistrationScreen
            onComplete={() => handleNavigate('DRIVER_DASHBOARD')}
            onBackToRoleSelect={() => handleNavigate('ROLE_SELECTION')}
            onGoToLogin={() => handleNavigate('LOGIN')}
          />
        );

      case 'SHIPPER_REGISTRATION':
        return (
          <ShipperRegistrationScreen
            onComplete={() => handleNavigate('SHIPPER_DASHBOARD')}
            onCancel={() => handleNavigate('ROLE_SELECTION')}
          />
        );

      case 'VERIFICATION_STATUS':
        return (
          <VerificationStatusScreen
            onBack={() => {
              if (role === 'DRIVER') handleNavigate('DRIVER_REGISTRATION');
              else handleNavigate('SHIPPER_REGISTRATION');
            }}
            onGoToDashboard={() => {
              if (role === 'ADMIN') handleNavigate('ADMIN_DASHBOARD');
              else if (role === 'SHIPPER') handleNavigate('SHIPPER_DASHBOARD');
              else handleNavigate('DRIVER_DASHBOARD');
            }}
            onResubmitProfile={() => {
              if (role === 'DRIVER') handleNavigate('DRIVER_REGISTRATION');
              else handleNavigate('SHIPPER_REGISTRATION');
            }}
          />
        );

      // Dashboards
      case 'ADMIN_DASHBOARD':
        // پنل مدیریت به‌صورت یک وب‌اپ جداگانه (`admin/`) منتشر می‌شود و در اپ موبایل نیست.
        return (
          <div dir={dir} className="min-h-screen flex items-center justify-center p-6 bg-[#fbf8ff]">
            <div className="bg-white border border-[#c4c5da] rounded-2xl p-8 max-w-md text-center space-y-3">
              <span className="material-symbols-outlined text-[#00258e] text-4xl">admin_panel_settings</span>
              <h2 className="font-bold text-lg">
                {trText('پنل مدیریت در نسخه وب', 'Admin panel is on the web', 'Yönetim paneli web üzerindedir')}
              </h2>
              <p className="text-sm text-[#545f72]">
                {trText(
                  'مدیریت کاربران، محموله‌ها، مالی و تأیید مدارک از طریق وب مدیریتی انجام می‌شود.',
                  'User management, cargo, finance and verification are handled in the admin web app.',
                  'Kullanıcı, yük, finans ve belge onayı işlemleri web yönetim panelinden yapılır.'
                )}
              </p>
              <button
                onClick={() => handleNavigate(role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD')}
                className="bg-[#00258e] text-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                {trText('بازگشت', 'Go back', 'Geri dön')}
              </button>
            </div>
          </div>
        );

      case 'DRIVER_DASHBOARD':
        return <DriverDashboardScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_DASHBOARD':
        return <ShipperDashboardScreen onNavigate={handleNavigate} />;

      // Section B: Driver Flow Screens
      case 'DRIVER_VEHICLE':
        return <DriverVehicleScreen onNavigate={handleNavigate} />;

      case 'DRIVER_BIDS':
        return <DriverBidsScreen onNavigate={handleNavigate} />;

      case 'DRIVER_ACTIVE_TRIP':
        return <DriverActiveTripScreen onNavigate={handleNavigate} />;

      case 'DRIVER_TRIP_HISTORY':
        return <DriverTripHistoryScreen onNavigate={handleNavigate} />;

      case 'DRIVER_EARNINGS':
        return <DriverEarningsScreen onNavigate={handleNavigate} />;

      case 'DRIVER_RATINGS':
        return <DriverRatingsScreen onNavigate={handleNavigate} />;

      case 'DRIVER_DISPUTES':
        return <DriverDisputesScreen onNavigate={handleNavigate} />;

      // Section C: Shipper Flow Screens
      case 'SHIPPER_CREATE_CARGO':
        return <ShipperCreateCargoScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_ACTIVE_CARGOS':
        return <ShipperActiveCargosScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_PAST_CARGOS':
        return <ShipperPastCargosScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_BIDS':
        return <ShipperBidsScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_CONTRACT':
        return <ShipperContractScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_ESCROW':
        return <ShipperEscrowScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_TRACKING':
        return <ShipperTrackingScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_DELIVERY_CONFIRM':
        return <ShipperDeliveryConfirmScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_INVOICE':
        return <ShipperInvoiceScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_RATING':
        return <ShipperRatingScreen onNavigate={handleNavigate} />;

      case 'SHIPPER_DISPUTES':
        return <ShipperDisputesScreen onNavigate={handleNavigate} />;

      // TLD Tracking Center & IoT Modules

      // Enterprise & Advanced Modules
      case 'DRIVER_BACKHAUL':
        return <DriverBackhaulScreen onNavigate={handleNavigate} />;

      case 'RMTO_WAYBILL_VERIFY':
        return <RMTOWaybillScreen onNavigate={handleNavigate} />;

      // Notifications & Chat
      case 'NOTIFICATIONS':
        return <NotificationsScreen onNavigate={handleNavigate} />;

      case 'NOTIFICATION_DETAIL':
        return <NotificationDetailScreen onNavigate={handleNavigate} />;

      case 'MESSAGES':
        return <MessagesScreen onNavigate={handleNavigate} />;

      case 'CHAT':
        return <ChatScreen onNavigate={handleNavigate} />;

      // Integrated Modules
      case 'CARGOS':
        return <CargosScreen onNavigate={handleNavigate} />;

      case 'TRIPS':
        return <TripsScreen onNavigate={handleNavigate} />;

      case 'WALLET':
        return <WalletScreen onNavigate={handleNavigate} />;

      case 'PROFILE':
        return <ProfileScreen onNavigate={handleNavigate} />;

      case 'EDIT_PROFILE':
        return <EditProfileScreen onNavigate={handleNavigate} />;

      case 'CHANGE_PASSWORD':
        return <ChangePasswordScreen onNavigate={handleNavigate} />;

      case 'SETTINGS':
        return <SettingsScreen onNavigate={handleNavigate} />;

      case 'TRANSACTIONS':
        return <TransactionsScreen onNavigate={handleNavigate} />;

      default:
        return <SplashScreen onStart={() => handleNavigate('ONBOARDING')} />;
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex flex-col font-vazirmatn relative">
      <OfflineBanner />
      <ToastContainer />

      {/* Main Dynamic View */}
      <main className="flex-1 w-full">{renderScreen()}</main>

    </div>
  );
};

// ErrorBoundary بیرون از بقیه درخت است، پس زبان را به‌صورت پراپ می‌گیرد.
const TranslatedErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { trText, dir } = useLanguage();
  return (
    <ErrorBoundary translate={trText} dir={dir}>
      {children}
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <TranslatedErrorBoundary>
        <AuthProvider>
          <LogisticsProvider>
            <AppContent />
          </LogisticsProvider>
        </AuthProvider>
      </TranslatedErrorBoundary>
    </LanguageProvider>
  );
}
