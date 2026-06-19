import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

/* ── Helpers ─────────────────────────────── */

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-slide-up">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      {message}
    </div>
  );
}

function InfoBox({ message }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 animate-slide-up">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      {message}
    </div>
  );
}

/* ── Main component ─────────────────────── */

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsSubmitting(true);
    try {
      const user = await signIn(email, password);
      // If user hasn't completed onboarding (no state/age), go there first
      if (!user?.state || !user?.age) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Firebase email not verified — show friendly message with hint
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.message === 'EMAIL_NOT_VERIFIED') {
        setInfo('Your email isn\'t verified yet. Please check your inbox and click the verification link, then try signing in again.');
      } else {
        setError(err.message || err.response?.data?.detail || 'Incorrect email or password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Step badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{
          background: 'rgba(233,138,21,0.1)',
          color: '#D97706',
          border: '1px solid rgba(233,138,21,0.2)',
        }}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        {t('auth.signIn')}
      </div>

      <h1 className="font-display text-2xl font-bold text-slate-900">
        {t('auth.signInTitle')}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
        {t('auth.signInSubtitle')}
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSignIn}>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signin-email" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
            {t('auth.emailLabel')}
            <span className="text-marigold-500 text-xs">*</span>
          </label>
          <div
            className="flex items-center overflow-hidden border-2 rounded-xl transition-all duration-200 bg-white border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 shadow-sm"
          >
            <div className="flex items-center px-3.5 flex-shrink-0 text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input
              id="signin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full py-3 pr-4 text-slate-900 outline-none bg-transparent text-[0.9375rem] placeholder-slate-400"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signin-password" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
            {t('auth.passwordLabel')}
            <span className="text-marigold-500 text-xs">*</span>
          </label>
          <div
            className="flex items-center overflow-hidden border-2 rounded-xl transition-all duration-200 bg-white border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 shadow-sm"
          >
            <div className="flex items-center px-3.5 flex-shrink-0 text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full py-3 text-slate-900 outline-none bg-transparent text-[0.9375rem] placeholder-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && <ErrorBox message={error} />}
        {info  && <InfoBox  message={info} />}

        <button
          id="signin-submit-btn"
          type="submit"
          disabled={isSubmitting || !email || !password}
          className="btn-gold flex items-center justify-center gap-2 !mt-6"
        >
          {isSubmitting ? (
            <><Spinner />{t('common.loading')}</>
          ) : (
            <>{t('auth.signIn')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-center text-sm text-slate-500">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="font-semibold text-amber-600 hover:text-amber-500 transition-colors underline-offset-2 hover:underline">
            {t('auth.createAccount')} →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
