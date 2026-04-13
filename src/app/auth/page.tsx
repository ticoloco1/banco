'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { sanitizeAppRedirect } from '@/lib/sanitizeAppRedirect';
import { Shield, Coins, Zap } from 'lucide-react';

function AuthForm() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = sanitizeAppRedirect(params.get('redirect'), '/editor');
  const authError = params.get('error');
  const authErrorDescription = params.get('error_description');
  const [isCompany, setIsCompany] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthInlineError, setOauthInlineError] = useState<string | null>(null);
  const T = useT();

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  const handleGoogle = async () => {
    if (oauthBusy) return;
    setOauthBusy(true);
    setOauthInlineError(null);
    const target = isCompany ? `/company/onboarding?redirect=${encodeURIComponent('/cv')}` : redirect;
    const { data, error } = await signInWithGoogle(target);
    if (error) {
      setOauthInlineError(error.message || 'oauth_start_failed');
      setOauthBusy(false);
      return;
    }
    // Fallback: força redirect caso o SDK não navegue automaticamente no browser atual.
    if (data?.url && typeof window !== 'undefined') {
      window.location.assign(data.url);
      return;
    }
    setOauthInlineError(T('auth_google_start_failed'));
    setOauthBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand/30">
            <span className="text-white font-black text-2xl">T</span>
          </div>
          <h1 className="font-black text-2xl text-[var(--text)]">TrustBank</h1>
          <p className="text-sm text-[var(--text2)] mt-1">
            {T('auth_welcome_back')}
          </p>
        </div>

        <div className="card p-6 space-y-4">

          {/* Google — primary CTA */}
          <button onClick={() => void handleGoogle()}
            disabled={oauthBusy}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm transition-all hover:opacity-90 text-white shadow-md"
            style={{ background: 'linear-gradient(135deg,#4285F4,#34A853)' }}>
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {T('auth_continue_google')}
          </button>

          {/* Wallet + payment info */}
          <div className="bg-[var(--bg2)] rounded-xl p-3 flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text2)] leading-relaxed">
              {T('auth_wallet_notice')}
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--text2)] cursor-pointer">
            <input type="checkbox" checked={isCompany} onChange={(e) => setIsCompany(e.target.checked)} />
            {T('auth_company_toggle')}
          </label>
          <p className="text-xs text-[var(--text2)] leading-relaxed">
            {T('auth_google_only_notice')}
          </p>
          {authError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-200">
              {T('auth_google_failed_prefix')} {authErrorDescription || authError}
            </div>
          ) : null}
          {oauthInlineError ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-200">
              {T('auth_google_failed_prefix')} {oauthInlineError}
            </div>
          ) : null}
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text2)] flex-wrap">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {T('auth_note_no_wallet_pw')}</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {T('auth_note_usdc_polygon')}</span>
          <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> {T('auth_note_auto_split')}</span>
        </div>
      </div>
    </div>
  );
}
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
