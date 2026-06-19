import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Compass, Settings, HelpCircle, 
  User, ClipboardCheck, FileText
} from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';

export default function Sidebar({ activePage, onVoiceCommand }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [logoError, setLogoError] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', id: 'dashboard' },
    { label: 'My Schemes', icon: ClipboardCheck, path: '/my-schemes', id: 'my-schemes' },
    { label: 'Explore', icon: Compass, path: '/explore', id: 'explore' },
    { label: 'Profile', icon: User, path: '/profile', id: 'profile' },
    { label: 'Settings', icon: Settings, path: '/settings', id: 'settings' },
    { label: 'Help', icon: HelpCircle, path: '/help', id: 'help' }
  ];

  // Default handler for voice command (redirection to Explore page with search query)
  const handleVoiceCommand = (text) => {
    if (onVoiceCommand) {
      onVoiceCommand(text);
    } else {
      navigate(`/?q=${encodeURIComponent(text)}`);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6 h-screen sticky top-0 flex-shrink-0 z-40">
      <div className="space-y-8">
        {/* Logo with dynamic fallback */}
        <Link to="/" className="flex items-center gap-3">
          {!logoError ? (
            <img 
              src="/emblem.svg" 
              alt="Logo" 
              onError={() => setLogoError(true)} 
              className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">Sahayak</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #E98A15, #F0A23E)' } : {}}
              >
                <item.icon className="w-5 h-5" />
                {t(`sidebar.${item.id}`)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Voice Assistant integrated in Sidebar */}
      <div className="pt-4 border-t border-slate-200 w-full flex flex-col items-center text-center space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">{t('dashboard.voiceAssistantBrief')}</span>
        <VoiceAssistant 
          activeLanguage={i18n.language} 
          onCommand={handleVoiceCommand} 
        />
        <span className="text-[9px] text-slate-400">{t('dashboard.voiceSpeakFarmer')}</span>
      </div>
    </aside>
  );
}
