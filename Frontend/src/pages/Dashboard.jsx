import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, MapPin, Briefcase, GraduationCap,
  Search, Volume2, VolumeX, Eye, ClipboardCheck, ArrowRight, HelpCircle,
  ChevronLeft, ChevronRight,
  Bookmark, CheckCircle
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Sidebar from '../components/Sidebar';
import { speakText, stopSpeaking } from '../components/VoiceAssistant';
import ProfileMenu from '../components/ProfileMenu';

// Helper to get category-based watermark background images
const getCategoryBgImage = (category) => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('agriculture') || cat.includes('rural') || cat.includes('environment')) {
    return 'https://images.unsplash.com/photo-1500937386664-56d159f8e9ad?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('education') || cat.includes('learning') || cat.includes('student')) {
    return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('health') || cat.includes('wellness') || cat.includes('medical')) {
    return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('banking') || cat.includes('finance') || cat.includes('insurance') || cat.includes('business') || cat.includes('entrepreneur')) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('welfare') || cat.includes('empowerment') || cat.includes('social')) {
    return 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('women') || cat.includes('child') || cat.includes('girl')) {
    return 'https://images.unsplash.com/photo-1519689680058-324335c77ebe?auto=format&fit=crop&q=80&w=600';
  }
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600';
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
  const [visitedCount, setVisitedCount] = useState(0);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(`bookmarks_${currentUser?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`bookmarks_${currentUser.id}`);
      setBookmarks(saved ? JSON.parse(saved) : []);
    }
  }, [currentUser]);

  const toggleBookmark = (schemeId) => {
    let updated;
    if (bookmarks.includes(schemeId)) {
      updated = bookmarks.filter(id => id !== schemeId);
    } else {
      updated = [...bookmarks, schemeId];
    }
    setBookmarks(updated);
    if (currentUser) {
      localStorage.setItem(`bookmarks_${currentUser.id}`, JSON.stringify(updated));
    }
  };

  const isBookmarked = (schemeId) => bookmarks.includes(schemeId);

  const getSortedList = (list) => {
    return [...list].sort((a, b) => {
      const aBook = isBookmarked(a.scheme_id) ? 1 : 0;
      const bBook = isBookmarked(b.scheme_id) ? 1 : 0;
      return bBook - aBook;
    });
  };

  // Pagination states
  const [recPage, setRecPage] = useState(0);
  const [recentPage, setRecentPage] = useState(0);
  const REC_ITEMS_PER_PAGE = 6;
  const RECENT_ITEMS_PER_PAGE = 3;

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

    // Reset local caches and force a refresh whenever profile changes
    setSchemeDetails({});
    setRecPage(0);
    setRecentPage(0);
    setActiveTab('eligible');
    setSearchResults([]);
    setSearchQuery('');

    loadRecommendations();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }

    // Load recently viewed from localStorage
    const saved = localStorage.getItem(`recently_viewed_${currentUser.id}`);
    if (saved) {
      setRecentlyViewed(JSON.parse(saved));
    } else {
      setRecentlyViewed([]);
    }

    // Load visited count from localStorage
    const savedVisited = localStorage.getItem(`visited_schemes_${currentUser.id}`);
    if (savedVisited) {
      setVisitedCount(JSON.parse(savedVisited).length);
    } else {
      setVisitedCount(0);
    }
  }, [currentUser, i18n.language]);

  // Handle Speech Recognition query result
  const handleVoiceCommand = (text) => {
    setActiveTab('search');
    handleSearch(text);
  };

  // Track clicked schemes
  const handleSchemeClick = async (scheme) => {
    const isExpanding = expandedSchemeId !== scheme.scheme_id;
    setExpandedSchemeId(isExpanding ? scheme.scheme_id : null);

    const updated = [scheme, ...recentlyViewed.filter(s => s.scheme_id !== scheme.scheme_id)].slice(0, 15);
    setRecentlyViewed(updated);
    localStorage.setItem(`recently_viewed_${currentUser?.id}`, JSON.stringify(updated));

    // Visited tracking
    let visitedList = [];
    const savedVisited = localStorage.getItem(`visited_schemes_${currentUser?.id}`);
    if (savedVisited) {
      visitedList = JSON.parse(savedVisited);
    }
    if (!visitedList.includes(scheme.scheme_id)) {
      visitedList.push(scheme.scheme_id);
      localStorage.setItem(`visited_schemes_${currentUser?.id}`, JSON.stringify(visitedList));
      setVisitedCount(visitedList.length);
    }

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

  // Helper parser for benefit numerical value to sum them up
  const parseBenefitAmount = (benefitStr) => {
    if (!benefitStr) return 0;
    // Look for numbers in the benefit string
    const match = benefitStr.replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Greeting helper based on local time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return t('dashboard.greetingMorning');
    if (hr < 17) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  // Card theme configurations
  const getSchemeColors = (index) => {
    const colors = [
      { text: '#E98A15', iconBg: 'bg-amber-500/10' },
      { text: '#25D366', iconBg: 'bg-emerald-500/10' },
      { text: '#A855F7', iconBg: 'bg-purple-500/10' },
    ];
    return colors[index % colors.length];
  };

  const totalBenefits = recommendations.reduce((sum, s) => sum + parseBenefitAmount(s.benefits), 0) || 45000;

  return (
    <div
      className="min-h-screen flex text-slate-900 overflow-hidden bg-slate-50"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <Sidebar activePage="dashboard" onVoiceCommand={handleVoiceCommand} />

      {/* ── Dashboard Content Wrapper ── */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md">
          {/* Search bar */}
          <div className="relative w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setActiveTab('search');
                handleSearch(e.target.value);
              }}
              placeholder={t('dashboard.searchPlaceholder')}
              className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>

          {/* Action icons & Profile */}
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="relative">
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* ── Main Dashboard Body ── */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-8 space-y-8 overflow-y-auto">

          {/* Greeting Title */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900">
              {getGreeting()}, {currentUser?.full_name} 👋
            </h1>
            <p className="text-sm text-slate-600">
              {t('dashboard.eligibleCount', { count: recommendations.length })}
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Eligible Schemes Card */}
            <div 
              onClick={() => navigate('/my-schemes')}
              className="rounded-2xl p-6 flex flex-col justify-between h-32 transition-all hover:scale-[1.02] cursor-pointer hover:border-amber-500/40 relative group"
              style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-amber-500">{recommendations.length}</span>
                <ChevronRight className="w-5 h-5 text-amber-500/40 group-hover:text-amber-500 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-amber-500/80 flex items-center gap-1">{t('dashboard.statsEligible')}</span>
            </div>

            {/* Visited Card */}
            <div 
              onClick={() => navigate('/my-schemes')}
              className="rounded-2xl p-6 flex flex-col justify-between h-32 transition-all hover:scale-[1.02] cursor-pointer hover:border-emerald-500/40 relative group"
              style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-extrabold text-emerald-500">{visitedCount}</span>
                <ChevronRight className="w-5 h-5 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
              </div>
              <span className="text-sm font-semibold text-emerald-500/80">{t('dashboard.statsVisited')}</span>
            </div>

            {/* Total Benefits Card */}
            <div className="rounded-2xl p-6 flex flex-col justify-between h-32 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1.5px solid rgba(168,85,247,0.3)' }}>
              <span className="text-3xl font-extrabold text-purple-400">₹{totalBenefits.toLocaleString('en-IN')}</span>
              <span className="text-sm font-semibold text-purple-400/80">{t('dashboard.statsBenefits')}</span>
            </div>
          </div>

          {/* Feed Content */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold font-display text-slate-900">
                  {activeTab === 'eligible' ? t('dashboard.topMatches') : t('dashboard.searchResults', { query: searchQuery })}
                </h2>
                {activeTab === 'eligible' && (
                  <Link 
                    to="/my-schemes" 
                    className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-0.5 hover:underline"
                  >
                    {t('dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
              {/* Pagination for Feed */}
              {((activeTab === 'eligible' && recommendations.length > REC_ITEMS_PER_PAGE) || 
                (activeTab === 'search' && searchResults.length > REC_ITEMS_PER_PAGE)) && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRecPage(p => Math.max(0, p - 1))}
                    disabled={recPage === 0}
                    className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setRecPage(p => p + 1)}
                    disabled={
                      activeTab === 'eligible' 
                        ? (recPage + 1) * REC_ITEMS_PER_PAGE >= recommendations.length 
                        : (recPage + 1) * REC_ITEMS_PER_PAGE >= searchResults.length
                    }
                    className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {loading && activeTab === 'eligible' ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
                <span className="text-xs text-slate-500 uppercase font-semibold">{t('dashboard.loadingMatches')}</span>
              </div>
            ) : activeTab === 'eligible' ? (
              recommendations.length === 0 ? (
                <div className="rounded-2xl p-10 text-center border border-slate-200 bg-white/50 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-500">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t('dashboard.noMatchesFound')}</h3>
                    <p className="text-slate-500 text-xs mt-1">{t('dashboard.noMatchesSubtext')}</p>
                  </div>
                  <Link to="/profile" className="inline-block px-5 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs transition-colors hover:bg-amber-400">{t('dashboard.updateProfile')}</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {getSortedList(recommendations).slice(recPage * REC_ITEMS_PER_PAGE, (recPage + 1) * REC_ITEMS_PER_PAGE).map((scheme, index) => renderMockupSchemeCard(scheme, index))}
                </div>
              )
            ) : (
              // Search Results
              searchQuery.trim() === '' ? (
                <div className="rounded-2xl p-10 text-center border border-slate-200 bg-white/50 text-slate-500 text-xs">
                  {t('dashboard.emptySearch')}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl p-10 text-center border border-slate-200 bg-white/50 text-slate-500 text-xs">
                  {t('dashboard.noSearchResults', { query: searchQuery })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {getSortedList(searchResults).slice(recPage * REC_ITEMS_PER_PAGE, (recPage + 1) * REC_ITEMS_PER_PAGE).map((scheme, index) => renderMockupSchemeCard(scheme, index))}
                </div>
              )
            )}
          </div>

          {/* Recently Viewed Section */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold font-display text-slate-900">{t('dashboard.recentlyViewed')}</h2>
              {recentlyViewed.length > RECENT_ITEMS_PER_PAGE && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRecentPage(p => Math.max(0, p - 1))}
                    disabled={recentPage === 0}
                    className="w-8 h-8 rounded-full border border-white/5 hover:border-white/20 flex items-center justify-center text-indigo-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setRecentPage(p => p + 1)}
                    disabled={(recentPage + 1) * RECENT_ITEMS_PER_PAGE >= recentlyViewed.length}
                    className="w-8 h-8 rounded-full border border-white/5 hover:border-white/20 flex items-center justify-center text-indigo-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {recentlyViewed.length === 0 ? (
              <p className="text-slate-500 text-xs">{t('dashboard.noRecentlyViewed')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentlyViewed.slice(recentPage * RECENT_ITEMS_PER_PAGE, (recentPage + 1) * RECENT_ITEMS_PER_PAGE).map((scheme, index) => (
                  <div
                    key={index}
                    onClick={async () => {
                      setActiveTab('eligible');
                      handleSchemeClick(scheme);
                    }}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="truncate pr-4 space-y-0.5">
                      <p className="text-xs font-semibold truncate text-slate-900">{scheme.scheme_name}</p>
                      <p className="text-[10px] text-slate-500">{scheme.schemeCategory || 'General'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );

  // Redesigned scheme card matching the mockup design
  function renderMockupSchemeCard(scheme, index) {
    const isExpanded = expandedSchemeId === scheme.scheme_id;
    const isSpeaking = speakingSchemeId === scheme.scheme_id;
    const colors = getSchemeColors(index);

    return (
      <div
        key={scheme.scheme_id}
        onClick={() => handleSchemeClick(scheme)}
        className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md relative group h-full overflow-hidden"
        style={{ borderTop: `4px solid ${colors.text}` }}
      >
        {/* Subtle Watermark Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-[0.08] transition-all group-hover:scale-105 duration-500" 
          style={{ backgroundImage: `url(${getCategoryBgImage(scheme.schemeCategory)})` }} 
        />

        <div className="flex flex-col gap-4 flex-grow mb-5 relative z-10">
          {/* Top Row: Icon + Badge */}
          <div className="flex justify-between items-start">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(scheme.scheme_id);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isBookmarked(scheme.scheme_id) 
                  ? 'bg-amber-500 text-white shadow-md' 
                  : `${colors.iconBg} hover:bg-slate-200`
              }`}
            >
              <Bookmark 
                className="w-5 h-5" 
                style={{ color: isBookmarked(scheme.scheme_id) ? '#ffffff' : colors.text }} 
                fill={isBookmarked(scheme.scheme_id) ? '#ffffff' : 'none'}
              />
            </button>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              {t('dashboard.youQualify')} <CheckCircle className="w-3 h-3" />
            </span>
          </div>

          {/* Scheme Title & Ministry */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-500 transition-colors">
              {scheme.scheme_name}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">
              {scheme.schemeCategory || "Ministry of General Affairs"}
            </p>
          </div>

          {/* Benefit & TTS */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 mt-auto">
            <div className="truncate pr-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">{t('dashboard.benefitLabel')}</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{scheme.benefits || t('dashboard.checkDetails')}</p>
            </div>

            <button
              onClick={(e) => handleSpeak(scheme, e)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${isSpeaking
                ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                : 'bg-white border-slate-200 hover:border-amber-500/50 text-slate-500 hover:text-amber-500'
                }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible details */}
        {isExpanded && (
          <div className="mb-4 pt-2 border-t border-slate-200 space-y-4 text-xs text-slate-600 animate-fade-in relative z-10">
            {!schemeDetails[scheme.scheme_id] ? (
              <div className="flex items-center gap-2 py-4 justify-center text-slate-500 font-semibold">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
                <span>{t('dashboard.loadingDetails')}</span>
              </div>
            ) : (
              <>
                {schemeDetails[scheme.scheme_id].details && (
                  <div>
                    <h4 className="font-bold mb-1 uppercase tracking-wide text-[9px] text-amber-500">{t('dashboard.schemeDetails')}</h4>
                    <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">{schemeDetails[scheme.scheme_id].details}</p>
                  </div>
                )}

                {schemeDetails[scheme.scheme_id].eligibility && (
                  <div>
                    <h4 className="font-bold mb-1 uppercase tracking-wide text-[9px] text-amber-500">{t('dashboard.eligibilityCriteria')}</h4>
                    <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">{schemeDetails[scheme.scheme_id].eligibility}</p>
                  </div>
                )}

                {schemeDetails[scheme.scheme_id].documents && (
                  <div>
                    <h4 className="font-bold mb-1 uppercase tracking-wide text-[9px] text-amber-500">{t('dashboard.requiredDocuments')}</h4>
                    <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">{schemeDetails[scheme.scheme_id].documents}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex gap-2.5 mt-auto pt-2 relative z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSchemeClick(scheme);
            }}
            className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all text-center"
          >
            {isExpanded ? t('dashboard.collapseDetails') : t('dashboard.expandDetails')}
          </button>

          <a
            href={getApplyUrl(scheme)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-2 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-300 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-all text-center flex items-center justify-center gap-1.5"
          >
            {t('dashboard.applyOnline')} <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }
}

// Helper function to extract URLs from text
const extractUrl = (text) => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s,\"\')]+/);
  return match ? match[0] : null;
};

// Helper function to dynamically construct the application link
const getApplyUrl = (scheme) => {
  if (!scheme) return '#';
  
  const isStatic = scheme.scheme_id < 100000;
  if (isStatic && scheme.slug) {
    return `https://www.myscheme.gov.in/schemes/${scheme.slug}`;
  }
  
  const urlFromApp = extractUrl(scheme.application);
  if (urlFromApp) return urlFromApp;
  
  const urlFromDetails = extractUrl(scheme.details);
  if (urlFromDetails) return urlFromDetails;
  
  return `https://www.google.com/search?q=how+to+apply+online+for+${encodeURIComponent(scheme.scheme_name)}`;
};

