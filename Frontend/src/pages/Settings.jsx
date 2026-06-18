import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Globe, Sparkles, AlertTriangle, Eye, Trash2, Check, Laptop
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();

  // Local settings state
  const [accent, setAccent] = useState(localStorage.getItem('sahayak_accent') || 'amber');
  const [emailNotif, setEmailNotif] = useState(true);
  const [waNotif, setWaNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [fontSize, setFontSize] = useState(localStorage.getItem('sahayak_font_size') || 'normal');
  const [screenReader, setScreenReader] = useState(false);
  
  // Danger zone alerts
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync settings with localStorage
  const handleAccentChange = (color) => {
    setAccent(color);
    localStorage.setItem('sahayak_accent', color);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('sahayak_font_size', size);
  };

  // Reset all local preferences
  const handleResetSettings = () => {
    localStorage.removeItem('sahayak_accent');
    localStorage.removeItem('sahayak_font_size');
    setAccent('amber');
    setFontSize('normal');
    setEmailNotif(true);
    setWaNotif(true);
    setSmsNotif(false);
    setScreenReader(false);
    alert('Settings reset to system defaults!');
  };

  // Mock account deletion
  const handleDeleteAccount = async () => {
    alert('Account deletion request registered. You will be logged out.');
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
    }
  }, [currentUser]);

  // Color mapper helper for display accents
  const accentsMap = [
    { name: 'amber', class: 'bg-amber-500', border: 'border-amber-500' },
    { name: 'emerald', class: 'bg-emerald-500', border: 'border-emerald-500' },
    { name: 'indigo', class: 'bg-indigo-500', border: 'border-indigo-500' },
    { name: 'purple', class: 'bg-purple-500', border: 'border-purple-500' }
  ];

  return (
    <div
      className="min-h-screen flex text-white overflow-hidden bg-[#060E1C]"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      <Sidebar activePage="settings" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#060E1C]/85 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-sm font-bold text-white">Application Settings</h1>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="relative">
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-3xl w-full mx-auto px-8 py-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-display tracking-tight text-white">Settings</h1>
            <p className="text-sm text-indigo-300/60">Manage portal preferences, accessibility, notifications, and accents</p>
          </div>

          {/* Preferences Groups */}
          <div className="grid grid-cols-1 gap-6 pb-12">
            
            {/* Preferred Language Card */}
            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Preferred Language</h2>
              </div>
              <p className="text-xs text-indigo-300/60">Select your default translation language for central and state schemes:</p>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'Hindi (हिंदी)' },
                  { code: 'te', label: 'Telugu (తెలుగు)' },
                  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' }
                ].map(lang => {
                  const isActive = i18n.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive 
                          ? 'bg-amber-500 text-black border-amber-500' 
                          : 'bg-white/5 border-white/10 hover:border-white/20 text-indigo-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Theme Card */}
            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Portal Accent</h2>
              </div>
              <p className="text-xs text-indigo-300/60">Customize the focus accent color scheme across cards, borders, and buttons:</p>
              
              <div className="flex gap-3">
                {accentsMap.map(acc => {
                  const isSelected = accent === acc.name;
                  return (
                    <button
                      key={acc.name}
                      onClick={() => handleAccentChange(acc.name)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${acc.class} ${
                        isSelected ? 'ring-4 ring-white shadow-lg' : 'opacity-65 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-5 h-5 text-black font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Notification Channels</h2>
              </div>
              <p className="text-xs text-indigo-300/60">Choose how you wish to receive updates regarding newly matches or deadlines:</p>
              
              <div className="space-y-3">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#070F1E] border border-white/5">
                  <div>
                    <p className="text-xs font-bold">Email Alerts</p>
                    <p className="text-[10px] text-indigo-300/40">Receive updates in your email inbox</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* WhatsApp Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#070F1E] border border-white/5">
                  <div>
                    <p className="text-xs font-bold">WhatsApp Updates</p>
                    <p className="text-[10px] text-indigo-300/40">Direct alerts on WhatsApp message feeds</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waNotif}
                    onChange={(e) => setWaNotif(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#070F1E] border border-white/5">
                  <div>
                    <p className="text-xs font-bold">SMS Notifications</p>
                    <p className="text-[10px] text-indigo-300/40">Standard text alerts on mobile network</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={(e) => setSmsNotif(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Accessibility Settings */}
            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Accessibility options</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold mb-2">Display Font Size</p>
                  <div className="flex gap-2">
                    {['normal', 'large', 'xlarge'].map(sz => (
                      <button
                        key={sz}
                        onClick={() => handleFontSizeChange(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                          fontSize === sz 
                            ? 'bg-amber-500 text-black font-bold' 
                            : 'bg-white/5 hover:bg-white/10 text-indigo-200'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#070F1E] border border-white/5">
                  <div>
                    <p className="text-xs font-bold">Screen Reader Voice Support</p>
                    <p className="text-[10px] text-indigo-300/40">Enhances spoken synthesis layout assistance</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={screenReader}
                    onChange={(e) => setScreenReader(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl p-6 border border-red-500/15 bg-red-500/[0.01] space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-400">Danger Zone</h2>
              </div>
              <p className="text-xs text-red-200/50">Actions that delete your portal settings or disable access accounts:</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleResetSettings}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 text-xs font-semibold bg-white/5 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Laptop className="w-4 h-4" /> Reset Portal Preferences
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 py-3 rounded-xl border border-red-500/20 text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Citizen Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0F1B30] border border-red-500/25 space-y-5 animate-scale-up shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-display font-bold text-base">Permanently Delete Account?</h3>
            </div>
            
            <p className="text-xs text-indigo-200/70 leading-relaxed">
              This will erase your matched schemes database references, certificate upload metadata vaults, and personal verification statuses. This action cannot be undone.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-400 text-white transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
