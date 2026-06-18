import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

/* ── Helpers ─────────────────────────────────────── */

function Spinner({ size = 'sm' }) {
  const s = size === 'lg' ? 'w-8 h-8' : 'w-4 h-4';
  return (
    <svg className={`animate-spin ${s}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200 animate-slide-up">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      {message}
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-indigo-200/90 flex items-center gap-1">
        {label}<span className="text-amber-400 text-xs">*</span>
      </label>
      <div className="flex items-center overflow-hidden border-2 rounded-xl transition-all duration-200 bg-white/5 border-white/10 focus-within:border-amber-500 focus-within:bg-white/[0.07]">
        <div className="flex items-center px-3.5 flex-shrink-0 text-indigo-300/60">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full py-3 text-white outline-none bg-transparent text-[0.9375rem] placeholder-white/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex items-center px-3.5 text-indigo-300/60 hover:text-white transition-colors flex-shrink-0"
          tabIndex={-1}
        >
          {show ? (
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
  );
}

/* ── Verification Waiting Screen ─────────────────── */

const POLL_INTERVAL_MS  = 3000;  // Check every 3 seconds
const RESEND_COOLDOWN_S = 60;    // Resend button cooldown

function VerificationWaiting({ email, onBack }) {
  const navigate                            = useNavigate();
  const { checkEmailVerified, resendVerification } = useAuth();

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendError, setResendError]       = useState('');
  const [resendSuccess, setResendSuccess]   = useState(false);
  const [checking, setChecking]             = useState(false);
  const pollerRef                           = useRef(null);

  /* Poll Firebase every 3 seconds for emailVerified */
  const poll = useCallback(async () => {
    setChecking(true);
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        clearInterval(pollerRef.current);
        navigate('/onboarding');
      }
    } catch (err) {
      console.error('Verification check failed:', err);
    } finally {
      setChecking(false);
    }
  }, [checkEmailVerified, navigate]);

  useEffect(() => {
    pollerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll(); // run immediately on mount
    return () => clearInterval(pollerRef.current);
  }, [poll]);

  /* Resend cooldown countdown */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendError('');
    setResendSuccess(false);
    try {
      await resendVerification();
      setResendCooldown(RESEND_COOLDOWN_S);
      setResendSuccess(true);
    } catch (err) {
      setResendError(err.message || 'Failed to resend. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center animate-fade-up">

        {/* Animated envelope */}
        <div className="relative mb-6">
          {/* Outer pulse rings */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'radial-gradient(circle, #E98A15, transparent)', transform: 'scale(1.8)' }}
          />
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ background: 'radial-gradient(circle, #E98A15, transparent)', transform: 'scale(1.4)' }}
          />
          {/* Icon container */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(233,138,21,0.2), rgba(240,162,62,0.1))', border: '2px solid rgba(233,138,21,0.3)' }}
          >
            <svg className="w-9 h-9 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl font-bold text-white mb-2">Check your inbox!</h1>
        <p className="text-sm text-indigo-300/80 mb-1">We've sent a verification link to</p>
        <p className="text-sm font-bold text-amber-400 mb-6 break-all">{email}</p>

        {/* Polling status pill */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-7 w-full"
          style={{ background: 'rgba(233,138,21,0.1)', border: '1.5px solid rgba(233,138,21,0.25)' }}
        >
          {checking ? (
            <Spinner />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          )}
          <span className="text-sm text-amber-300 text-left">
            {checking ? 'Checking verification status…' : 'Waiting for email verification…'}
          </span>
        </div>

        {/* Steps */}
        <div className="w-full space-y-3 mb-7 text-left">
          {[
            { num: '1', text: 'Open the email from Sahayak' },
            { num: '2', text: 'Click "Verify email address"' },
            { num: '3', text: 'This page will automatically advance' },
          ].map((s) => (
            <div key={s.num} className="flex items-start gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)' }}
              >
                {s.num}
              </span>
              <p className="text-sm text-indigo-200/80">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Resend */}
        <div className="w-full flex flex-col items-center gap-2">
          {resendSuccess && (
            <p className="text-xs text-emerald-400 font-medium animate-slide-up">
              ✓ Verification email resent successfully
            </p>
          )}
          {resendError && (
            <p className="text-xs text-red-400 animate-slide-up">{resendError}</p>
          )}
          <button
            type="button"
            disabled={resendCooldown > 0}
            onClick={handleResend}
            className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Didn't get it? Resend email"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="mt-1 text-xs text-indigo-400/70 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Use a different account
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

/* ── Main SignUp component ───────────────────────── */

export default function SignUp() {
  const { t } = useTranslation();
  const { register } = useAuth();

  const [step, setStep]             = useState('form'); // 'form' | 'verifying'
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  /* ── Register handler ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, name);
      setRegisteredEmail(email);
      setStep('verifying');       // ← Switch to verification waiting screen
    } catch (err) {
      const msg = err.message || err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim() && email.trim() && password && confirmPassword;

  /* Show verification screen after registration */
  if (step === 'verifying') {
    return (
      <VerificationWaiting
        email={registeredEmail}
        onBack={() => setStep('form')}
      />
    );
  }

  /* ── Registration form ── */
  return (
    <AuthLayout>
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ background: 'rgba(233,138,21,0.1)', color: '#F0A23E', border: '1px solid rgba(233,138,21,0.2)' }}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        {t('auth.signUpTitle')}
      </div>

      <h1 className="font-display text-2xl font-bold text-white">{t('auth.signUpTitle')}</h1>
      <p className="mt-1.5 text-sm text-indigo-300/80 leading-relaxed">{t('auth.signUpSubtitle')}</p>

      <form className="mt-7 space-y-4" onSubmit={handleRegister}>

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-name" className="text-sm font-semibold text-indigo-200/90 flex items-center gap-1">
            {t('auth.nameLabel')}<span className="text-amber-400 text-xs">*</span>
          </label>
          <div className="flex items-center overflow-hidden border-2 rounded-xl transition-all duration-200 bg-white/5 border-white/10 focus-within:border-amber-500 focus-within:bg-white/[0.07]">
            <div className="flex items-center px-3.5 flex-shrink-0 text-indigo-300/60">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              className="w-full py-3 pr-4 text-white outline-none bg-transparent text-[0.9375rem] placeholder-white/20"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-sm font-semibold text-indigo-200/90 flex items-center gap-1">
            {t('auth.emailLabel')}<span className="text-amber-400 text-xs">*</span>
          </label>
          <div className="flex items-center overflow-hidden border-2 rounded-xl transition-all duration-200 bg-white/5 border-white/10 focus-within:border-amber-500 focus-within:bg-white/[0.07]">
            <div className="flex items-center px-3.5 flex-shrink-0 text-indigo-300/60">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full py-3 pr-4 text-white outline-none bg-transparent text-[0.9375rem] placeholder-white/20"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="signup-password"
          label={t('auth.passwordLabel')}
          value={password}
          onChange={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
        />

        {/* Confirm Password */}
        <PasswordInput
          id="signup-confirm-password"
          label={t('auth.confirmPasswordLabel')}
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={t('auth.confirmPasswordPlaceholder')}
        />

        {/* Password match indicator */}
        {confirmPassword.length > 0 && (
          <div className={`flex items-center gap-2 text-xs font-medium ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
            {password === confirmPassword ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Passwords match
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Passwords don't match
              </>
            )}
          </div>
        )}

        {error && <ErrorBox message={error} />}

        <button
          id="signup-submit-btn"
          type="submit"
          disabled={isSubmitting || !isValid}
          className="btn-gold flex items-center justify-center gap-2 !mt-6"
        >
          {isSubmitting ? (
            <><Spinner /> Creating account…</>
          ) : (
            <>
              Create Account &amp; Send Verification
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-white/10">
        <p className="text-center text-sm text-indigo-300/70">
          {t('auth.haveAccount')}{' '}
          <Link to="/signin" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors underline-offset-2 hover:underline">
            {t('auth.signInInstead')} →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
