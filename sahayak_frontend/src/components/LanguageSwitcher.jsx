import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हिं' },
  { code: 'te', label: 'తె' },
  { code: 'kn', label: 'ಕನ್' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const active = i18n.language?.split('-')[0] || 'en';

  return (
    <div
      role="radiogroup"
      aria-label="Choose language"
      className="inline-flex items-center gap-0.5 rounded-full p-1 border border-white/10 bg-white/5 backdrop-blur-md"
    >
      {LANGUAGES.map(({ code, label }) => {
        const isActive = active === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => i18n.changeLanguage(code)}
            className={[
              'px-3.5 py-1.5 text-xs font-bold rounded-full transition-all duration-250 select-none uppercase tracking-wide',
              isActive
                ? 'text-white shadow-sm'
                : 'text-indigo-200/60 hover:text-white hover:bg-white/5',
            ].join(' ')}
            style={
              isActive
                ? { background: 'linear-gradient(135deg, #E98A15, #F0A23E)', transform: 'scale(1.05)' }
                : {}
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
