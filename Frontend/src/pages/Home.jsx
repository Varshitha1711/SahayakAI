import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const features = [
    {
      emoji: '🛡️',
      title: t('home.features.secureTitle'),
      desc: t('home.features.secureDesc'),
    },
    {
      emoji: '🌐',
      title: t('home.features.langTitle'),
      desc: t('home.features.langDesc'),
    },
    {
      emoji: '⚡',
      title: t('home.features.matchTitle'),
      desc: t('home.features.matchDesc'),
    },
  ];

  const stats = [
    { value: '500+', label: t('home.stats.schemes') },
    { value: '28', label: t('home.stats.states') },
    { value: '4', label: t('home.stats.langs') },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      {/* ── Ambient orbs ── */}
      <div
        className="orb animate-float"
        style={{
          width: '650px', height: '650px',
          background: 'radial-gradient(circle, rgba(233,138,21,0.18) 0%, transparent 70%)',
          top: '-180px', left: '-180px',
        }}
      />
      <div
        className="orb animate-float3"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(62,92,138,0.2) 0%, transparent 70%)',
          top: '40%', right: '-120px',
        }}
      />
      <div
        className="orb animate-float2"
        style={{
          width: '320px', height: '320px',
          background: 'radial-gradient(circle, rgba(233,138,21,0.1) 0%, transparent 70%)',
          bottom: '0', left: '35%',
        }}
      />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-pattern-light pointer-events-none" />

      {/* Decorative ring */}
      <div
        className="absolute rounded-full border border-slate-300/40 pointer-events-none"
        style={{ width: '700px', height: '700px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="absolute rounded-full border border-slate-300/30 pointer-events-none"
        style={{ width: '1000px', height: '1000px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <img
            src="/emblem.svg"
            alt="Logo"
            className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5 shadow-glow-gold flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
          <div
            className="w-10 h-10 rounded-xl hidden items-center justify-center flex-shrink-0 shadow-glow-gold"
            style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                fill="rgba(255,255,255,0.2)"
              />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-xl font-bold text-slate-900 tracking-tight">
            {t('app.name')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {currentUser && <ProfileMenu darkMode={true} />}
        </div>
      </header>

      {/* ── Hero section ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-up"
          style={{ borderColor: 'rgba(233,138,21,0.3)' }}
        >
          <span
            className="w-2 h-2 rounded-full bg-marigold-400 animate-bounce-dot"
            style={{ boxShadow: '0 0 8px rgba(233,138,21,0.8)' }}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-marigold-400">
            {t('app.tagline')}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-bold leading-tight text-slate-900 animate-fade-up delay-100"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', maxWidth: '820px' }}
        >
          {t('app.tagline')}
          <br />
          <span className="text-gradient-gold">{t('home.heroEffortless')}</span>
        </h1>

        <p className="mt-6 text-slate-600 leading-relaxed animate-fade-up delay-200"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)', maxWidth: '440px' }}
        >
          {t('home.heroSub')}
        </p>

        {/* CTA */}
        {currentUser ? (
          <div className="mt-10 glass rounded-2xl px-8 py-5 animate-fade-up delay-300">
            <p className="text-slate-600 text-sm">
              {t('home.signedInAs')}{' '}
              <span className="font-bold text-marigold-500">{currentUser.email || currentUser.phoneNumber}</span>
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
            <Link
              to="/signin"
              id="home-signin-btn"
              className="btn-gold inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 text-base"
            >
              {t('auth.signInTitle')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link
              to="/signup"
              id="home-signup-btn"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 text-base font-semibold rounded-xl border-2 text-slate-700 transition-all duration-255 hover:bg-slate-200 hover:border-slate-300 active:scale-95"
              style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}
            >
              {t('auth.createAccount')}
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-16 flex items-center gap-6 sm:gap-12 animate-fade-up delay-400">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-gradient-gold">{s.value}</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl animate-fade-up delay-500">
          {features.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex flex-col items-start gap-3 text-left">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(233,138,21,0.12)', border: '1px solid rgba(233,138,21,0.2)' }}
              >
                {f.emoji}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 py-5 text-center">
        <p className="text-[11px] text-slate-400">
          {t('home.footer')}
        </p>
      </footer>
    </div>
  );
}
