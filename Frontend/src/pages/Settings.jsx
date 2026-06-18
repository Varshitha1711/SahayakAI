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
      className="min-h-screen flex text-slate-900 overflow-hidden bg-slate-50"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <Sidebar activePage="settings" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-sm font-bold text-slate-900">Application Settings</h1>
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
            <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">Manage portal preferences, accessibility, notifications, and accents</p>
          </div>

          {/* Preferences Groups */}
          <div className="grid grid-cols-1 gap-6 pb-12">
            
            {/* Preferred Language Card */}
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Preferred Language</h2>
              </div>
              <p className="text-xs text-slate-500">Select your default translation language for central and state schemes:</p>
              
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
                          ? 'bg-amber-500 text-white border-amber-500' 
                          : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Theme Card */}
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Portal Accent</h2>
              </div>
              <p className="text-xs text-slate-500">Customize the focus accent color scheme across cards, borders, and buttons:</p>
              
              <div className="flex gap-3">
                {accentsMap.map(acc => {
                  const isSelected = accent === acc.name;
                  return (
                    <button
                      key={acc.name}
                      onClick={() => handleAccentChange(acc.name)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${acc.class} ${
                        isSelected ? 'ring-4 ring-slate-300 shadow-lg' : 'opacity-65 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-5 h-5 text-white font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Notification Channels</h2>
              </div>
              <p className="text-xs text-slate-500">Choose how you wish to receive updates regarding newly matches or deadlines:</p>
              
              <div className="space-y-3">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Email Alerts</p>
                    <p className="text-[10px] text-slate-400">Receive updates in your email inbox</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* WhatsApp Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">WhatsApp Updates</p>
                    <p className="text-[10px] text-slate-400">Direct alerts on WhatsApp message feeds</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waNotif}
                    onChange={(e) => setWaNotif(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">SMS Notifications</p>
                    <p className="text-[10px] text-slate-400">Standard text alerts on mobile network</p>
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
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Accessibility options</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold mb-2 text-slate-800">Display Font Size</p>
                  <div className="flex gap-2">
                    {['normal', 'large', 'xlarge'].map(sz => (
                      <button
                        key={sz}
                        onClick={() => handleFontSizeChange(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all border ${
                          fontSize === sz 
                            ? 'bg-amber-500 border-amber-500 text-white font-bold' 
                            : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Screen Reader Voice Support</p>
                    <p className="text-[10px] text-slate-400">Enhances spoken synthesis layout assistance</p>
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
            <div className="rounded-2xl p-6 border border-red-200 bg-red-50/50 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">Danger Zone</h2>
              </div>
              <p className="text-xs text-slate-500">Actions that delete your portal settings or disable access accounts:</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleResetSettings}
                  className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold bg-white text-slate-700 transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  <Laptop className="w-4 h-4" /> Reset Portal Preferences
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 py-3 rounded-xl border border-red-200 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all text-center flex items-center justify-center gap-2"
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
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 space-y-5 animate-scale-up shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-display font-bold text-base">Permanently Delete Account?</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              This will erase your matched schemes database references, certificate upload metadata vaults, and personal verification statuses. This action cannot be undone.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all"
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
