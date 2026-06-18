import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { TextField, SelectField } from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { INDIAN_STATES } from '../data/indianStates';

/* ─────────────────────────────────────── */
/* Initial form state                      */
/* ─────────────────────────────────────── */

const initialFormData = {
  age: '',
  gender: '',
  state: '',
  district: '',
  occupation: '',
  annual_income: '',
  category: '',
  education_level: '',
  disability_status: '',
  marital_status: '',
};

/* ─────────────────────────────────────── */
/* Section config                          */
/* ─────────────────────────────────────── */

const SECTION_META = [
  {
    key: 'location',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    color: '#3B82F6',
  },
  {
    key: 'personal',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    color: '#8B5CF6',
  },
  {
    key: 'status',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: '#D97706',
  },
];

function SectionCard({ metaKey, title, children }) {
  const meta = SECTION_META.find((m) => m.key === metaKey);
  return (
    <div
      className="glass-card rounded-2xl p-6 border border-slate-200 transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.color, color: 'white', boxShadow: `0 4px 12px ${meta.color}40` }}
        >
          {meta.icon}
        </div>
        <h2
          className="text-xs font-bold uppercase tracking-[0.15em]"
          style={{ color: meta.color }}
        >
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round" />
    </svg>
  );
}

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Require logged-in user
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
    }
  }, [currentUser, navigate]);

  const updateField = (field) => (value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /* ── Option lists (dynamically translated) ── */
  const stateOptions = INDIAN_STATES.map((name) => ({ value: name, label: name }));

  const genderOptions = [
    { value: 'Male', label: t('onboarding.options.gender.male') },
    { value: 'Female', label: t('onboarding.options.gender.female') },
    { value: 'Other', label: t('onboarding.options.gender.other') }
  ];

  const maritalStatusOptions = [
    { value: 'Single', label: t('onboarding.options.maritalStatus.single') },
    { value: 'Married', label: t('onboarding.options.maritalStatus.married') },
    { value: 'Widowed', label: t('onboarding.options.maritalStatus.widowed') },
    { value: 'Divorced', label: t('onboarding.options.maritalStatus.divorced') }
  ];

  const categoryOptions = [
    { value: 'General', label: t('onboarding.options.category.general') },
    { value: 'OBC', label: t('onboarding.options.category.obc') },
    { value: 'SC', label: t('onboarding.options.category.sc') },
    { value: 'ST', label: t('onboarding.options.category.st') }
  ];

  const occupationOptions = [
    { value: 'Student', label: t('onboarding.options.occupation.student') },
    { value: 'Farmer', label: t('onboarding.options.occupation.farmer') },
    { value: 'Worker', label: t('onboarding.options.occupation.worker') },
    { value: 'Entrepreneur', label: t('onboarding.options.occupation.entrepreneur') },
    { value: 'Unemployed', label: t('onboarding.options.occupation.unemployed') },
    { value: 'Retired', label: t('onboarding.options.occupation.retired') }
  ];

  const educationOptions = [
    { value: '10th', label: t('onboarding.options.education.below10') },
    { value: 'Intermediate', label: t('onboarding.options.education.intermediate') },
    { value: 'UG', label: t('onboarding.options.education.ug') },
    { value: 'PG', label: t('onboarding.options.education.pg') },
    { value: 'PhD', label: t('onboarding.options.education.phd') },
    { value: 'Any', label: t('onboarding.options.education.any') }
  ];

  const yesNoOptions = [
    { value: 'no', label: t('onboarding.options.yesNo.no') },
    { value: 'yes', label: t('onboarding.options.yesNo.yes') }
  ];

  /* ── Submit Onboarding Payload to FastAPI ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      state: formData.state,
      district: formData.district,
      occupation: formData.occupation,
      annual_income: parseFloat(formData.annual_income),
      category: formData.category,
      education_level: formData.education_level,
      disability_status: formData.disability_status === 'yes',
      marital_status: formData.marital_status,
    };

    try {
      await updateProfile(payload);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save profile. Please check the inputs.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = 
    formData.age && 
    formData.gender && 
    formData.state && 
    formData.district.trim() && 
    formData.occupation && 
    formData.annual_income && 
    formData.category && 
    formData.education_level && 
    formData.disability_status && 
    formData.marital_status;

  return (
    <AuthLayout maxWidthClass="max-w-2xl">
      <div className="mb-8">
        {/* Step badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{
            background: 'rgba(233,138,21,0.1)',
            color: '#D97706',
            border: '1px solid rgba(233,138,21,0.2)',
          }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {t('onboarding.badge')}
        </div>

        <h1 className="font-display text-2xl font-bold text-slate-900">
          {t('onboarding.title')}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          {t('onboarding.subtitle')}
        </p>

        {/* Progress bar */}
        <div className="mt-5 flex gap-1.5">
          {SECTION_META.map((m) => (
            <div
              key={m.key}
              className="h-1 flex-1 rounded-full"
              style={{ background: metaKeyColor(m.key), opacity: 0.7 }}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{t('onboarding.subtext')}</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>

        {/* ── Location ── */}
        <SectionCard metaKey="location" title={t('onboarding.sections.location')}>
          <SelectField
            id="state"
            label={t('onboarding.fields.state')}
            required
            value={formData.state}
            onChange={updateField('state')}
            options={stateOptions}
            placeholder={t('onboarding.placeholders.state')}
          />
          <TextField
            id="district"
            label={t('onboarding.fields.district')}
            required
            value={formData.district}
            onChange={updateField('district')}
            placeholder={t('onboarding.placeholders.district')}
          />
        </SectionCard>

        {/* ── Personal ── */}
        <SectionCard metaKey="personal" title={t('onboarding.sections.personal')}>
          <TextField
            id="age"
            label={t('onboarding.fields.age')}
            type="number"
            required
            inputMode="numeric"
            value={formData.age}
            onChange={updateField('age')}
            placeholder={t('onboarding.placeholders.age')}
          />
          <SelectField
            id="gender"
            label={t('onboarding.fields.gender')}
            required
            value={formData.gender}
            onChange={updateField('gender')}
            options={genderOptions}
            placeholder={t('onboarding.placeholders.gender')}
          />
          <SelectField
            id="marital_status"
            label={t('onboarding.fields.maritalStatus')}
            required
            value={formData.marital_status}
            onChange={updateField('marital_status')}
            options={maritalStatusOptions}
            placeholder={t('onboarding.placeholders.maritalStatus')}
          />
        </SectionCard>

        {/* ── Socio-Economic Profile ── */}
        <SectionCard metaKey="status" title={t('onboarding.sections.status')}>
          <SelectField
            id="category"
            label={t('onboarding.fields.category')}
            required
            value={formData.category}
            onChange={updateField('category')}
            options={categoryOptions}
            placeholder={t('onboarding.placeholders.category')}
          />
          <SelectField
            id="occupation"
            label={t('onboarding.fields.occupation')}
            required
            value={formData.occupation}
            onChange={updateField('occupation')}
            options={occupationOptions}
            placeholder={t('onboarding.placeholders.occupation')}
          />
          <TextField
            id="annual_income"
            label={t('onboarding.fields.annualIncome')}
            type="number"
            required
            value={formData.annual_income}
            onChange={updateField('annual_income')}
            placeholder={t('onboarding.placeholders.annualIncome')}
          />
          <SelectField
            id="education_level"
            label={t('onboarding.fields.educationLevel')}
            required
            value={formData.education_level}
            onChange={updateField('education_level')}
            options={educationOptions}
            placeholder={t('onboarding.placeholders.educationLevel')}
          />
          <SelectField
            id="disability_status"
            label={t('onboarding.fields.disabilityStatus')}
            required
            value={formData.disability_status}
            onChange={updateField('disability_status')}
            options={yesNoOptions}
            placeholder={t('onboarding.placeholders.disabilityStatus')}
          />
        </SectionCard>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-slide-up">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button
            id="onboarding-submit-btn"
            type="submit"
            disabled={isSubmitting || !isValid}
            className="btn-gold flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Spinner />{t('onboarding.saving')}</>
            ) : (
              <>
                {t('onboarding.submit')}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            {t('onboarding.privacy')}
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

// Simple helper to get colors outside metadata component boundaries
function metaKeyColor(key) {
  const meta = SECTION_META.find((m) => m.key === key);
  return meta ? meta.color : '#E98A15';
}