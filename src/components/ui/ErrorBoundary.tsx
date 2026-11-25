import React, { ReactNode } from 'react';

type Translate = (fa: string, en: string, tr: string) => string;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** از LanguageProvider تزریق می‌شود؛ این کامپوننت خارج از Provider رندر می‌شود. */
  translate?: Translate;
  dir?: 'rtl' | 'ltr';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      localStorage.removeItem('tld_current_screen');
    } catch {}
    window.location.reload();
  };

  private handleReturnToDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      localStorage.setItem('tld_current_screen', 'DRIVER_DASHBOARD');
    } catch {}
    window.location.reload();
  };

  private t = (fa: string, en: string, tr: string): string => {
    const fn = this.props.translate;
    return fn ? fn(fa, en, tr) : fa;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          dir={this.props.dir || 'rtl'}
          className="min-h-screen bg-[#fbf8ff] text-[#1a1b23] flex items-center justify-center p-4 font-vazirmatn"
        >
          <div className="bg-white border border-[#c4c5da] rounded-2xl p-6 max-w-md w-full shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-[#ba1a1a]/10 text-[#ba1a1a] rounded-2xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">sync_problem</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1a1b23]">
                {this.t(
                  'خطای موقت در بارگذاری صفحه',
                  'Temporary page load error',
                  'Sayfa yüklenirken geçici hata'
                )}
              </h2>
              <p className="text-xs text-[#545f72] leading-relaxed">
                {this.t(
                  'سامانه برای جلوگیری از خروج ناگهانی، این خطا را مهار کرده است. می‌توانید با دکمه‌های زیر فوراً به کار خود ادامه دهید.',
                  'The app caught this error to avoid a sudden crash. Use the buttons below to continue immediately.',
                  'Uygulama ani kapanmayı önlemek için bu hatayı yakaladı. Aşağıdaki düğmelerle hemen devam edebilirsiniz.'
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReturnToDashboard}
                className="w-full py-2.5 bg-[#00258e] text-white rounded-xl text-xs font-bold hover:bg-[#001c70] transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>{this.t('بازگشت به داشبورد اصلی', 'Back to dashboard', 'Ana panele dön')}</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2.5 bg-[#f4f2fe] text-[#00258e] border border-[#c4c5da] rounded-xl text-xs font-bold hover:bg-[#e2e1ed] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>{this.t('تازه‌سازی سامانه', 'Reload the app', 'Uygulamayı yenile')}</span>
              </button>
            </div>

            {(import.meta as any).env?.MODE !== 'production' && this.state.error && (
              <details className="text-start bg-[#f8f9ff] p-2.5 rounded-lg border border-[#e1e2ec] text-[10px] font-jetbrains text-[#ba1a1a] overflow-auto max-h-32">
                <summary className="cursor-pointer font-bold">
                  {this.t('جزئیات فنی خطا (Debug)', 'Technical error details (Debug)', 'Teknik hata ayrıntıları (Debug)')}
                </summary>
                <p className="mt-1">{this.state.error.toString()}</p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
