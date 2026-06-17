import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

/* Subtle dot-grid overlay */
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  );
}

export default function AuthLayout({ children, maxWidthClass = 'max-w-md' }) {
  const { t } = useTranslation();

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden text-white"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      {/* Background decoration */}
      <DotGrid />
      <div className="orb w-96 h-96 bg-marigold-500/10 -top-32 -left-32 animate-float pointer-events-none" />
      <div className="orb w-80 h-80 bg-indigo-400/8 bottom-10 -right-16 animate-float3 pointer-events-none" />

      {/* Header bar (unified with Dashboard & Home style) */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow-gold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.25)"/>
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">
            {t('app.name')}
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Center main form body with glass card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className={`w-full ${maxWidthClass}`}>
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden animate-fade-up">
            {/* Soft decorative background glow inside the card */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-marigold-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Unified footer */}
      <footer className="relative z-10 px-6 py-5 text-center border-t border-white/5 bg-white/[0.01]">
        <p className="text-[11px] text-indigo-300/40">{t('app.tagline')}</p>
      </footer>
    </div>
  );
}
