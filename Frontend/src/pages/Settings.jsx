import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useAuth();

  // Local settings state
  const [emailNotif, setEmailNotif] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    // Set initial email notifications state from backend
    if (currentUser.email_notifications !== undefined && currentUser.email_notifications !== null) {
      setEmailNotif(currentUser.email_notifications);
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  // Handle email notification toggle on backend
  const handleEmailToggle = async (newValue) => {
    setEmailNotif(newValue);
    setSaving(true);
    try {
      await updateProfile({
        age: currentUser.age,
        gender: currentUser.gender,
        state: currentUser.state,
        district: currentUser.district,
        occupation: currentUser.occupation,
        annual_income: currentUser.annual_income,
        category: currentUser.category,
        education_level: currentUser.education_level,
        disability_status: currentUser.disability_status,
        marital_status: currentUser.marital_status,
        email_notifications: newValue,
      });
    } catch (err) {
      console.error('Failed to update notification setting:', err);
      // Rollback on failure
      setEmailNotif(!newValue);
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="font-display text-sm font-bold text-slate-900">{t('settings.title')}</h1>
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
            <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">{t('settings.heading')}</h1>
            <p className="text-sm text-slate-500">{t('settings.subheading')}</p>
          </div>

          {/* Preferences Groups */}
          <div className="grid grid-cols-1 gap-6 pb-12">
            
            {/* Preferred Language Card */}
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{t('settings.languageSection')}</h2>
              </div>
              <p className="text-xs text-slate-500">{t('settings.languageDesc')}</p>
              
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

            {/* Notification Toggles */}
            <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{t('settings.notificationsSection')}</h2>
              </div>
              <p className="text-xs text-slate-500">{t('settings.notificationsDesc')}</p>
              
              <div className="space-y-3">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('settings.emailAlerts')}</p>
                    <p className="text-[10px] text-slate-400">{t('settings.emailAlertsDesc')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving && (
                      <span className="text-[10px] text-slate-400 animate-pulse">Saving...</span>
                    )}
                    <input
                      type="checkbox"
                      checked={emailNotif}
                      onChange={(e) => handleEmailToggle(e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 accent-amber-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
