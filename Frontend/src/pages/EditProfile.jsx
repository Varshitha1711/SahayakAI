import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, MapPin, Briefcase, IndianRupee, GraduationCap, 
  Sparkles, FileText, CheckCircle2, Edit3, X, Save, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TextField, SelectField } from '../components/FormField';
import { INDIAN_STATES } from '../data/indianStates';
import Sidebar from '../components/Sidebar';
import ProfileMenu from '../components/ProfileMenu';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ── Section config ──────────────────────────── */
const SECTIONS = [
  { key: 'location', label: 'Location', color: '#3B82F6', icon: (
    <MapPin className="w-5 h-5" />
  )},
  { key: 'personal', label: 'Personal Information', color: '#8B5CF6', icon: (
    <User className="w-5 h-5" />
  )},
  { key: 'status', label: 'Socio-Economic Status', color: '#D97706', icon: (
    <Sparkles className="w-5 h-5" />
  )},
];

function SectionCard({ sectionKey, children }) {
  const s = SECTIONS.find((x) => x.key === sectionKey);
  return (
    <div
      className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.07]"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: s.color, boxShadow: `0 4px 12px ${s.color}40` }}
        >
          {s.icon}
        </div>
        <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: s.color }}>
          {s.label}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
      <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round"/>
    </svg>
  );
}

export default function EditProfile() {
  const { t }                          = useTranslation();
  const navigate                       = useNavigate();
  const { currentUser, updateProfile } = useAuth();

  const [form, setForm]           = useState(null);  // null until pre-filled
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /* Pre-fill form from currentUser */
  useEffect(() => {
    if (!currentUser) { navigate('/signin'); return; }
    setForm({
      age:               String(currentUser.age  || ''),
      gender:            currentUser.gender           || '',
      state:             currentUser.state            || '',
      district:          currentUser.district         || '',
      occupation:        currentUser.occupation       || '',
      annual_income:     String(currentUser.annual_income || ''),
      category:          currentUser.category         || '',
      education_level:   currentUser.education_level  || '',
      disability_status: currentUser.disability_status ? 'yes' : 'no',
      marital_status:    currentUser.marital_status   || '',
    });
  }, [currentUser, navigate]);

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  /* Options */
  const stateOptions         = INDIAN_STATES.map((n) => ({ value: n, label: n }));
  const genderOptions        = [
    { value: 'Male',   label: t('onboarding.options.gender.male') },
    { value: 'Female', label: t('onboarding.options.gender.female') },
    { value: 'Other',  label: t('onboarding.options.gender.other') },
  ];
  const maritalStatusOptions = [
    { value: 'Single',   label: t('onboarding.options.maritalStatus.single') },
    { value: 'Married',  label: t('onboarding.options.maritalStatus.married') },
    { value: 'Widowed',  label: t('onboarding.options.maritalStatus.widowed') },
    { value: 'Divorced', label: t('onboarding.options.maritalStatus.divorced') },
  ];
  const categoryOptions      = [
    { value: 'General', label: t('onboarding.options.category.general') },
    { value: 'OBC',     label: t('onboarding.options.category.obc') },
    { value: 'SC',      label: t('onboarding.options.category.sc') },
    { value: 'ST',      label: t('onboarding.options.category.st') },
  ];
  const occupationOptions    = [
    { value: 'Student',      label: t('onboarding.options.occupation.student') },
    { value: 'Farmer',       label: t('onboarding.options.occupation.farmer') },
    { value: 'Worker',       label: t('onboarding.options.occupation.worker') },
    { value: 'Entrepreneur', label: t('onboarding.options.occupation.entrepreneur') },
    { value: 'Unemployed',   label: t('onboarding.options.occupation.unemployed') },
    { value: 'Retired',      label: t('onboarding.options.occupation.retired') },
  ];
  const educationOptions     = [
    { value: '10th',         label: t('onboarding.options.education.below10') },
    { value: 'Intermediate', label: t('onboarding.options.education.intermediate') },
    { value: 'UG',           label: t('onboarding.options.education.ug') },
    { value: 'PG',           label: t('onboarding.options.education.pg') },
    { value: 'PhD',          label: t('onboarding.options.education.phd') },
    { value: 'Any',          label: t('onboarding.options.education.any') },
  ];
  const yesNoOptions         = [
    { value: 'no',  label: t('onboarding.options.yesNo.no') },
    { value: 'yes', label: t('onboarding.options.yesNo.yes') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await updateProfile({
        age:               parseInt(form.age, 10),
        gender:            form.gender,
        state:             form.state,
        district:          form.district,
        occupation:        form.occupation,
        annual_income:     parseFloat(form.annual_income),
        category:          form.category,
        education_level:   form.education_level,
        disability_status: form.disability_status === 'yes',
        marital_status:    form.marital_status,
      });
      setSuccess('Profile updated! Your scheme recommendations will refresh.');
      setTimeout(() => {
        setIsEditing(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Wait for pre-fill */
  if (!form) return null;

  const isValid =
    form.age && form.gender && form.state && form.district.trim() &&
    form.occupation && form.annual_income && form.category &&
    form.education_level && form.disability_status && form.marital_status;

  const profileCompletion = () => {
    const vals = Object.values(form).filter((v) => v !== '');
    return Math.round((vals.length / Object.keys(form).length) * 100);
  };

  const renderSummary = () => {
    return (
      <div className="space-y-6 animate-fade-up">
        {/* Header Hero Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/[0.08] relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-white text-3xl flex-shrink-0 relative group"
                style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 8px 30px rgba(233,138,21,0.3)' }}
              >
                {currentUser?.full_name?.[0]?.toUpperCase() || '?'}
                <div className="absolute inset-0 rounded-2xl bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold">
                  Profile
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">{currentUser?.full_name}</h2>
                <p className="text-sm text-indigo-300/80 font-medium">{currentUser?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Email Verified
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {profileCompletion()}% Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons side-by-side */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto btn-gold px-6 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
              <button
                onClick={() => navigate('/documents')}
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 text-sm rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <FileText className="w-4 h-4 text-indigo-300" /> Upload Certificates
              </button>
            </div>
          </div>
        </div>

        {/* Structured Grid of Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location details card */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Location</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">State</label>
                  <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.state || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">District</label>
                  <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.district || 'Not Specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal details card */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <User className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Personal</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Age</label>
                    <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.age ? `${currentUser.age} Years` : 'Not Specified'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Gender</label>
                    <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.gender || 'Not Specified'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Marital Status</label>
                  <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.marital_status || 'Not Specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Socio-Economic details card */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.01] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Socio-Economic</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Category</label>
                    <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.category || 'Not Specified'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Income (Annual)</label>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {currentUser?.annual_income ? `₹${Number(currentUser.annual_income).toLocaleString('en-IN')}` : 'Not Specified'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Occupation</label>
                    <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.occupation || 'Not Specified'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Education</label>
                    <p className="text-sm font-semibold text-white mt-0.5">{currentUser?.education_level || 'Not Specified'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/40 block">Disability Status</label>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {currentUser?.disability_status ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex text-white overflow-hidden bg-[#060E1C]"
      style={{ background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)' }}
    >
      <Sidebar activePage="profile" />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <div className="absolute inset-0 dot-pattern pointer-events-none" />
        <div className="orb animate-float" style={{ width: '550px', height: '550px', background: 'radial-gradient(circle, rgba(233,138,21,0.1) 0%, transparent 70%)', top: '-150px', left: '-150px' }} />

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#060E1C]/85 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-sm font-bold text-white">
              {isEditing ? 'Edit Profile' : 'User Profile'}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <ProfileMenu />
          </div>
        </header>

        {/* ── Content ── */}
        <main className="relative z-10 flex-grow max-w-4xl w-full mx-auto px-8 py-10 space-y-6">
          {!isEditing ? (
            renderSummary()
          ) : (
            <div className="space-y-6 animate-fade-up">
              {/* Account info (read-only in form) */}
              <div
                className="rounded-2xl p-5 flex items-center gap-4 bg-white/[0.02] border border-white/[0.07]"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 6px 20px rgba(233,138,21,0.4)' }}
                >
                  {currentUser?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-base">{currentUser?.full_name}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{currentUser?.email}</p>
                  <span
                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Email Verified
                  </span>
                </div>
                <p className="text-[10px] text-indigo-400/60 text-right hidden sm:block leading-relaxed">
                  Name &amp; email<br/>cannot be changed
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Location */}
                <SectionCard sectionKey="location">
                  <SelectField
                    id="edit-state"
                    label={t('onboarding.fields.state')}
                    required
                    value={form.state}
                    onChange={set('state')}
                    options={stateOptions}
                    placeholder={t('onboarding.placeholders.state')}
                  />
                  <TextField
                    id="edit-district"
                    label={t('onboarding.fields.district')}
                    required
                    value={form.district}
                    onChange={set('district')}
                    placeholder={t('onboarding.placeholders.district')}
                  />
                </SectionCard>

                {/* Personal */}
                <SectionCard sectionKey="personal">
                  <TextField
                    id="edit-age"
                    label={t('onboarding.fields.age')}
                    type="number"
                    required
                    inputMode="numeric"
                    value={form.age}
                    onChange={set('age')}
                    placeholder={t('onboarding.placeholders.age')}
                  />
                  <SelectField
                    id="edit-gender"
                    label={t('onboarding.fields.gender')}
                    required
                    value={form.gender}
                    onChange={set('gender')}
                    options={genderOptions}
                    placeholder={t('onboarding.placeholders.gender')}
                  />
                  <SelectField
                    id="edit-marital-status"
                    label={t('onboarding.fields.maritalStatus')}
                    required
                    value={form.marital_status}
                    onChange={set('marital_status')}
                    options={maritalStatusOptions}
                    placeholder={t('onboarding.placeholders.maritalStatus')}
                  />
                </SectionCard>

                {/* Socio-Economic */}
                <SectionCard sectionKey="status">
                  <SelectField
                    id="edit-category"
                    label={t('onboarding.fields.category')}
                    required
                    value={form.category}
                    onChange={set('category')}
                    options={categoryOptions}
                    placeholder={t('onboarding.placeholders.category')}
                  />
                  <SelectField
                    id="edit-occupation"
                    label={t('onboarding.fields.occupation')}
                    required
                    value={form.occupation}
                    onChange={set('occupation')}
                    options={occupationOptions}
                    placeholder={t('onboarding.placeholders.occupation')}
                  />
                  <TextField
                    id="edit-annual-income"
                    label={t('onboarding.fields.annualIncome')}
                    type="number"
                    required
                    value={form.annual_income}
                    onChange={set('annual_income')}
                    placeholder={t('onboarding.placeholders.annualIncome')}
                  />
                  <SelectField
                    id="edit-education-level"
                    label={t('onboarding.fields.educationLevel')}
                    required
                    value={form.education_level}
                    onChange={set('education_level')}
                    options={educationOptions}
                    placeholder={t('onboarding.placeholders.educationLevel')}
                  />
                  <SelectField
                    id="edit-disability-status"
                    label={t('onboarding.fields.disabilityStatus')}
                    required
                    value={form.disability_status}
                    onChange={set('disability_status')}
                    options={yesNoOptions}
                    placeholder={t('onboarding.placeholders.disabilityStatus')}
                  />
                </SectionCard>

                {/* Feedback */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm text-red-200 animate-slide-up"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
                    <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm text-emerald-200 animate-slide-up"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.25)' }}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                    {success}
                  </div>
                )}

                {/* Actions block */}
                <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    id="edit-profile-save-btn"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className="w-full sm:w-1/2 btn-gold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed py-3"
                  >
                    {isSubmitting ? (
                      <><Spinner /> Saving...</>
                    ) : (
                      <>
                        <Save className="w-4.5 h-4.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-1/2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <X className="w-4.5 h-4.5" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
