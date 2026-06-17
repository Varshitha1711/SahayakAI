import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, MapPin, Briefcase, Award, GraduationCap, Heart, HelpCircle, 
  Search, Volume2, VolumeX, Eye, ClipboardCheck, ArrowRight, LogOut 
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import VoiceAssistant, { speakText, stopSpeaking } from '../components/VoiceAssistant';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();

  // State variables
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('eligible'); // 'eligible' | 'search'
  const [speakingSchemeId, setSpeakingSchemeId] = useState(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [schemeDetails, setSchemeDetails] = useState({}); // stores full details by scheme_id
  const [emblemLoaded, setEmblemLoaded] = useState(false);

  // Load recommended schemes
  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/schemes/recommendations`, {
        params: { lang: i18n.language }
      });
      setRecommendations(response.data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle live search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/schemes/search`, {
        params: { q: query, lang: i18n.language }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search query failed:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    // Redirect if they have not finished onboarding
    if (!currentUser.state || !currentUser.age) {
      navigate('/onboarding');
      return;
    }
    setSchemeDetails({}); // clear detailed cache on language switch
    loadRecommendations();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
    
    // Load recently viewed from localStorage
    const saved = localStorage.getItem(`recently_viewed_${currentUser.id}`);
    if (saved) {
      setRecentlyViewed(JSON.parse(saved));
    }
  }, [currentUser, i18n.language]);

  // Handle Speech Recognition query result
  const handleVoiceCommand = (text) => {
    setActiveTab('search');
    handleSearch(text);
  };

  // Profile completion calculation
  const getProfileCompletion = () => {
    if (!currentUser) return 0;
    const fields = [
      currentUser.age,
      currentUser.gender,
      currentUser.state,
      currentUser.district,
      currentUser.occupation,
      currentUser.annual_income,
      currentUser.category,
      currentUser.education_level,
      currentUser.marital_status
    ];
    const filled = fields.filter(val => val !== null && val !== undefined && val !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  // Track clicked schemes
  const handleSchemeClick = async (scheme) => {
    const isExpanding = expandedSchemeId !== scheme.scheme_id;
    setExpandedSchemeId(isExpanding ? scheme.scheme_id : null);
    
    const updated = [scheme, ...recentlyViewed.filter(s => s.scheme_id !== scheme.scheme_id)].slice(0, 5);
    setRecentlyViewed(updated);
    localStorage.setItem(`recently_viewed_${currentUser?.id}`, JSON.stringify(updated));

    if (isExpanding && !schemeDetails[scheme.scheme_id]) {
      try {
        const response = await axios.get(`${API_BASE_URL}/schemes/${scheme.scheme_id}`, {
          params: { lang: i18n.language }
        });
        setSchemeDetails(prev => ({ ...prev, [scheme.scheme_id]: response.data }));
      } catch (err) {
        console.error('Failed to load scheme details:', err);
      }
    }
  };

  // Text to Speech controls
  const handleSpeak = (scheme, e) => {
    e.stopPropagation();
    if (speakingSchemeId === scheme.scheme_id) {
      stopSpeaking();
      setSpeakingSchemeId(null);
    } else {
      const details = schemeDetails[scheme.scheme_id] || scheme;
      
      // Localized speech labels
      const getSpeakLabels = (lang) => {
        switch (lang?.split('-')[0]) {
          case 'hi':
            return { benefits: 'लाभ', eligibility: 'योग्यता मानदंड' };
          case 'te':
            return { benefits: 'ప్రయోజనాలు', eligibility: 'అర్హత ప్రమాణాలు' };
          case 'kn':
            return { benefits: 'ಪ್ರಯೋಜನಗಳು', eligibility: 'ಅರ್ಹತಾ ಮಾನದಂಡಗಳು' };
          default:
            return { benefits: 'Benefits', eligibility: 'Eligibility' };
        }
      };
      
      const labels = getSpeakLabels(i18n.language);
      const isExpanded = expandedSchemeId === scheme.scheme_id;
      
      let textParts = [];
      if (details.schemeCategory) {
        textParts.push(details.schemeCategory);
      }
      textParts.push(details.scheme_name);
      if (details.benefits) {
        textParts.push(`${labels.benefits}: ${details.benefits}`);
      }
      if (isExpanded && details.eligibility) {
        textParts.push(`${labels.eligibility}: ${details.eligibility}`);
      }
      
      const textToRead = textParts.join('. ');
      
      speakText(textToRead, i18n.language, () => setSpeakingSchemeId(null));
      setSpeakingSchemeId(scheme.scheme_id);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden text-white"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      {/* ── Background Elements ── */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />
      <div className="orb animate-float" style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(233,138,21,0.12) 0%, transparent 70%)', top: '-100px', right: '-100px' }} />
      <div className="orb animate-float2" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(62,92,138,0.15) 0%, transparent 70%)', bottom: '-50px', left: '-50px' }} />

      {/* ── Navigation Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          {emblemLoaded ? (
            <img 
              src="/src/assets/emblem.png" 
              alt="State Emblem of India" 
              className="w-auto object-contain"
              style={{ 
                filter: 'url(#gold-emblem) drop-shadow(0 0 4px rgba(233,138,21,0.5))',
                clipPath: 'inset(11% 13% 11% 13%)',
                marginLeft: '-14px',
                marginRight: '-14px',
                height: '50px'
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          <span className="font-display text-lg font-bold tracking-tight">Sahayak AI</span>
        </Link>

        {/* Hidden Image for automatic asset-existence detection */}
        <img 
          src="/src/assets/emblem.png" 
          alt="" 
          style={{ display: 'none' }} 
          onLoad={() => setEmblemLoaded(true)} 
        />

        <div className="flex items-center gap-4">
          <Link to="/documents" className="text-xs font-semibold text-indigo-200 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            {t('dashboard.uploadDocuments')}
          </Link>
          <LanguageSwitcher />
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 transition-all"
            title={t('auth.signOut', 'Log Out')}
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* ── Dashboard Grid ── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column (Main Dashboard Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Welcome Card */}
          <div className="glass rounded-3xl p-6 relative overflow-hidden border border-white/10">
            <div className="space-y-3 animate-fade-up">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {t('dashboard.portalActive')}
              </div>
              <h1 className="text-2xl font-bold font-display">{t('dashboard.welcome')}, {currentUser?.full_name}</h1>
              <p className="text-indigo-200/60 text-xs leading-relaxed max-w-md">
                {t('dashboard.summaryText')}{' '}
                <strong className="text-white">
                  {currentUser?.district ? `(${currentUser.district}, ${currentUser.state})` : ''}
                </strong>
              </p>
              
              {/* Profile Chip Summary */}
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-indigo-400" /> 
                  {currentUser?.age} {t('common.years', 'Yrs')} · {t(`onboarding.options.gender.${currentUser?.gender?.toLowerCase()}`, currentUser?.gender)}
                </span>
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-indigo-400" /> {currentUser?.state}
                </span>
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-indigo-400" /> {t(`onboarding.options.occupation.${currentUser?.occupation?.toLowerCase()}`, currentUser?.occupation)}
                </span>
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-indigo-400" /> 
                  {t(`onboarding.options.education.${currentUser?.education_level === '10th' ? 'below10' : currentUser?.education_level === 'Intermediate' ? 'intermediate' : currentUser?.education_level === 'UG' ? 'ug' : currentUser?.education_level === 'PG' ? 'pg' : currentUser?.education_level === 'PhD' ? 'phd' : 'any'}`, currentUser?.education_level)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Switch Tabs (Eligible vs Live Search) ── */}
          <div className="flex border-b border-white/5 gap-6">
            <button
              onClick={() => setActiveTab('eligible')}
              className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
                activeTab === 'eligible' 
                  ? 'text-amber-400 border-amber-400' 
                  : 'text-indigo-300/50 border-transparent hover:text-indigo-200'
              }`}
            >
              {t('dashboard.tabs.eligible')} ({recommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 ${
                activeTab === 'search' 
                  ? 'text-amber-400 border-amber-400' 
                  : 'text-indigo-300/50 border-transparent hover:text-indigo-200'
              }`}
            >
              {t('dashboard.tabs.search')}
            </button>
          </div>

          {/* ── Search Input (Only shown in Search Tab or as quick access) ── */}
          {activeTab === 'search' && (
            <div className="relative w-full animate-slide-up">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                className="w-full bg-white/[0.03] border-2 border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white/[0.05] text-white"
              />
              <Search className="w-5 h-5 text-indigo-400/50 absolute left-4 top-3.5" />
            </div>
          )}

          {/* ── Schemes Feeds ── */}
          <div className="space-y-4">
            {loading && activeTab === 'eligible' ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
                <span className="text-xs text-indigo-300/60 uppercase font-semibold">{t('common.loading')}</span>
              </div>
            ) : activeTab === 'eligible' ? (
              recommendations.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center border border-white/5 space-y-4 animate-fade-up">
                  <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-indigo-300">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{t('dashboard.noSchemes')}</h3>
                    <p className="text-indigo-300/50 text-xs mt-1">{t('dashboard.noSchemesSubtext')}</p>
                  </div>
                  <Link to="/onboarding" className="btn-gold inline-flex w-auto px-6 py-2.5 text-xs">{t('dashboard.updateProfile')}</Link>
                </div>
              ) : (
                recommendations.map(scheme => renderSchemeCard(scheme))
              )
            ) : (
              // Search tab
              searchQuery.trim() === '' ? (
                <div className="glass rounded-2xl p-10 text-center border border-white/5 text-indigo-300/40 text-xs animate-fade-up">
                  {t('dashboard.emptySearch')}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center border border-white/5 text-indigo-300/40 text-xs animate-fade-up">
                  {t('dashboard.noSearchResults')} "{searchQuery}"
                </div>
              ) : (
                searchResults.map(scheme => renderSchemeCard(scheme))
              )
            )}
          </div>
        </div>

        {/* Right Side Column (Voice Assistant & History) */}
        <div className="space-y-6">
          
          {/* Voice Assistant Module */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col items-center text-center space-y-4 relative overflow-hidden animate-fade-up">
            {/* Pulsing ring indicator */}
            <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-amber-500/5 filter blur-xl" />
            
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold font-display uppercase tracking-widest text-amber-400">{t('dashboard.voiceAssistant')}</h2>
              <p className="text-indigo-200/50 text-xs leading-relaxed px-4">
                {t('dashboard.voiceDesc')}
              </p>
            </div>
            
            {/* The Floating mic toggle button */}
            <VoiceAssistant 
              activeLanguage={i18n.language} 
              onCommand={handleVoiceCommand} 
            />

            <div className="pt-2 text-[10px] text-indigo-400/60 leading-normal border-t border-white/5 w-full space-y-1">
              <p>{t('dashboard.voiceTry')} <strong>"Farmer"</strong> / <strong>"Student"</strong></p>
              <p>{t('dashboard.voiceSupports')}</p>
            </div>
          </div>

          {/* Recently Viewed Schemes */}
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-4 animate-fade-up">
            <h2 className="text-xs font-bold font-display uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" /> {t('dashboard.recentlyViewed')}
            </h2>
            {recentlyViewed.length === 0 ? (
              <p className="text-indigo-300/40 text-xs">{t('dashboard.noRecentlyViewed')}</p>
            ) : (
              <div className="space-y-2.5">
                {recentlyViewed.map((scheme, index) => {
                  const matched = 
                    recommendations.find(r => r.scheme_id === scheme.scheme_id) ||
                    searchResults.find(r => r.scheme_id === scheme.scheme_id) ||
                    schemeDetails[scheme.scheme_id];
                  
                  const displayName = matched ? matched.scheme_name : scheme.scheme_name;
                  const displayCategory = matched ? matched.schemeCategory : scheme.schemeCategory;
                  
                  return (
                    <div 
                      key={index} 
                      onClick={async () => {
                        const targetTab = recommendations.some(r => r.scheme_id === scheme.scheme_id) ? 'eligible' : 'search';
                        setActiveTab(targetTab);
                        setExpandedSchemeId(scheme.scheme_id);
                        
                        if (!schemeDetails[scheme.scheme_id]) {
                          try {
                            const response = await axios.get(`${API_BASE_URL}/schemes/${scheme.scheme_id}`, {
                              params: { lang: i18n.language }
                            });
                            setSchemeDetails(prev => ({ ...prev, [scheme.scheme_id]: response.data }));
                          } catch (err) {
                            console.error('Failed to load scheme details:', err);
                          }
                        }
                      }}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="truncate pr-4">
                        <p className="text-xs font-semibold truncate text-indigo-100">{displayName}</p>
                        <p className="text-[10px] text-indigo-400/60 mt-0.5">{displayCategory || t('onboarding.options.category.general')}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400/50 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Chroma key filter for converting white-to-transparent and black-to-gold */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="gold-emblem">
            <feColorMatrix 
              type="matrix" 
              values="0 0 0 0 0.91
                      0 0 0 0 0.54
                      0 0 0 0 0.08
                      -0.333 -0.333 -0.333 0 1" 
            />
          </filter>
        </defs>
      </svg>
    </div>
  );

  // Helper renderer for individual Scheme Cards
  function renderSchemeCard(scheme) {
    const isExpanded = expandedSchemeId === scheme.scheme_id;
    const isSpeaking = speakingSchemeId === scheme.scheme_id;

    return (
      <div 
        key={scheme.scheme_id} 
        onClick={() => handleSchemeClick(scheme)}
        className="glass-card rounded-2xl p-5 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer space-y-3 relative group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-500/20">
              {scheme.schemeCategory || t('onboarding.options.category.general')}
            </span>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-amber-400 transition-colors pr-2 text-white">
              {scheme.scheme_name}
            </h3>
          </div>
          
          {/* TTS Listen Button */}
          <button
            onClick={(e) => handleSpeak(scheme, e)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
              isSpeaking 
                ? 'bg-amber-50 border-amber-500 text-white animate-pulse' 
                : 'bg-white/5 border-white/10 hover:border-amber-500/50 text-indigo-300 hover:text-amber-400'
            }`}
            title={isSpeaking ? 'Stop speech' : 'Listen to scheme details'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Benefits Preview */}
        <p className="text-xs text-indigo-200/70 line-clamp-2 leading-relaxed">
          {scheme.benefits || 'No details provided.'}
        </p>

        {/* Collapsible expanded details */}
        {isExpanded && (
          <div className="pt-4 border-t border-white/5 space-y-4 text-xs text-indigo-200/80 animate-fade-in">
            {!schemeDetails[scheme.scheme_id] ? (
              <div className="flex items-center gap-2 py-4 justify-center text-indigo-300/60 font-semibold">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
                <span>{t('common.loading', 'Loading details...')}</span>
              </div>
            ) : (
              <>
                {schemeDetails[scheme.scheme_id].details && (
                  <div>
                    <h4 className="font-bold text-white mb-1.5 uppercase tracking-wide text-[10px] text-amber-500">{t('dashboard.schemeDetails')}</h4>
                    <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].details}</p>
                  </div>
                )}
                
                {schemeDetails[scheme.scheme_id].eligibility && (
                  <div>
                    <h4 className="font-bold text-white mb-1.5 uppercase tracking-wide text-[10px] text-amber-500">{t('dashboard.eligibilityCriteria')}</h4>
                    <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].eligibility}</p>
                  </div>
                )}

                {schemeDetails[scheme.scheme_id].documents && (
                  <div>
                    <h4 className="font-bold text-white mb-1.5 uppercase tracking-wide text-[10px] text-amber-500">{t('dashboard.requiredDocuments')}</h4>
                    <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].documents}</p>
                  </div>
                )}

                {schemeDetails[scheme.scheme_id].application && (
                  <div>
                    <h4 className="font-bold text-white mb-1.5 uppercase tracking-wide text-[10px] text-amber-500">{t('dashboard.howToApply')}</h4>
                    <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].application}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-indigo-300/40 pt-1">
          <span>{t('dashboard.schemeLevel')}: {scheme.level || 'Central / State'}</span>
          <span className="font-semibold text-amber-400/70 group-hover:underline flex items-center gap-1">
            {isExpanded ? t('dashboard.collapseDetails') : t('dashboard.expandDetails')} 
            <ArrowRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </span>
        </div>
      </div>
    );
  }
}
