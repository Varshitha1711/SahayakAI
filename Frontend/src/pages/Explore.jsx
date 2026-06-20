import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Search, Bookmark, Volume2, VolumeX, ArrowRight, 
  Sparkles, Award, Users, Globe, Building2, Eye, Compass, LayoutGrid
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';
import { speakText, stopSpeaking } from '../components/VoiceAssistant';

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

// Static categories configuration with styling details
const EXPLORE_CATEGORIES = [
  { 
    id: 'agriculture', 
    label: 'Agriculture & Rural', 
    value: 'Agriculture, Rural & Environment',
    gradient: 'from-emerald-500/10 to-teal-500/5', 
    border: 'border-emerald-500/20', 
    textColor: 'text-emerald-400',
    icon: '🌾' 
  },
  { 
    id: 'education', 
    label: 'Education & Learning', 
    value: 'Education & Learning',
    gradient: 'from-blue-500/10 to-indigo-500/5', 
    border: 'border-blue-500/20', 
    textColor: 'text-blue-400',
    icon: '🎓' 
  },
  { 
    id: 'health', 
    label: 'Health & Wellness', 
    value: 'Health & Wellness',
    gradient: 'from-rose-500/10 to-red-500/5', 
    border: 'border-rose-500/20', 
    textColor: 'text-rose-400',
    icon: '🏥' 
  },
  { 
    id: 'banking', 
    label: 'Banking & Finance', 
    value: 'Banking, Financial Services & Insurance',
    gradient: 'from-amber-500/10 to-orange-500/5', 
    border: 'border-amber-500/20', 
    textColor: 'text-amber-400',
    icon: '🏛️' 
  },
  { 
    id: 'welfare', 
    label: 'Social Welfare', 
    value: 'Social Welfare & Empowerment',
    gradient: 'from-purple-500/10 to-violet-500/5', 
    border: 'border-purple-500/20', 
    textColor: 'text-purple-400',
    icon: '🤝' 
  },
  { 
    id: 'women', 
    label: 'Women & Child', 
    value: 'Women & Child',
    gradient: 'from-pink-500/10 to-fuchsia-500/5', 
    border: 'border-pink-500/20', 
    textColor: 'text-pink-400',
    icon: '👩' 
  },
  { 
    id: 'business', 
    label: 'Business & Self-Employment', 
    value: 'Business & Entrepreneurship',
    gradient: 'from-cyan-500/10 to-sky-500/5', 
    border: 'border-cyan-500/20', 
    textColor: 'text-cyan-400',
    icon: '💼' 
  }
];

// Target Groups chips


export default function Explore() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search query from URL or local state
  const queryParam = searchParams.get('q') || '';
  
  // Local state
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [speakingSchemeId, setSpeakingSchemeId] = useState(null);
  const [schemeDetails, setSchemeDetails] = useState({});

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

  // Fetch explore search results
  const fetchExploreSchemes = async () => {
    setLoading(true);
    try {
      // Use backend '/all' with pagination limit of 30 for explore page
      const response = await axios.get(`${API_BASE_URL}/schemes/all`, {
        params: {
          page: 1,
          limit: 30,
          category: selectedCategory || undefined,
          q: searchQuery || undefined,
          lang: i18n.language
        }
      });
      
      let filtered = response.data;
      
     
      setSchemes(filtered);
    } catch (err) {
      console.error('Failed to load explore schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync searchQuery local state with searchParams update
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Load recommendations/results on parameter change
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    fetchExploreSchemes();
  }, [currentUser, searchQuery, selectedCategory, i18n.language]);

  // Voice Query Callback integration from Sidebar
  const handleVoiceCommand = (text) => {
    setSearchParams({ q: text });
  };

  // Tracking Clicked schemes (unique visited counter)
  const handleSchemeClick = async (scheme) => {
    const isExpanding = expandedSchemeId !== scheme.scheme_id;
    setExpandedSchemeId(isExpanding ? scheme.scheme_id : null);

    // Track visit
    let visitedList = [];
    const savedVisited = localStorage.getItem(`visited_schemes_${currentUser?.id}`);
    if (savedVisited) {
      visitedList = JSON.parse(savedVisited);
    }
    if (!visitedList.includes(scheme.scheme_id)) {
      visitedList.push(scheme.scheme_id);
      localStorage.setItem(`visited_schemes_${currentUser?.id}`, JSON.stringify(visitedList));
    }

    if (isExpanding && !schemeDetails[scheme.scheme_id]) {
      try {
        const response = await axios.get(`${API_BASE_URL}/schemes/${scheme.scheme_id}`, {
          params: { lang: i18n.language }
        });
        setSchemeDetails(prev => ({ ...prev, [scheme.scheme_id]: response.data }));
      } catch (err) {
        console.error('Failed to load details:', err);
      }
    }
  };

  // Speech helper
  const handleSpeak = (scheme, e) => {
    e.stopPropagation();
    if (speakingSchemeId === scheme.scheme_id) {
      stopSpeaking();
      setSpeakingSchemeId(null);
    } else {
      const details = schemeDetails[scheme.scheme_id] || scheme;
      const labels = i18n.language?.startsWith('hi') 
        ? { benefits: 'लाभ', eligibility: 'योग्यता' } 
        : i18n.language?.startsWith('te')
        ? { benefits: 'ప్రయోజనాలు', eligibility: 'అర్హత' }
        : { benefits: 'Benefits', eligibility: 'Eligibility' };
      
      let textParts = [details.schemeCategory || '', details.scheme_name];
      if (details.benefits) textParts.push(`${labels.benefits}: ${details.benefits}`);
      if (expandedSchemeId === scheme.scheme_id && details.eligibility) {
        textParts.push(`${labels.eligibility}: ${details.eligibility}`);
      }

      speakText(textParts.join('. '), i18n.language, () => setSpeakingSchemeId(null));
      setSpeakingSchemeId(scheme.scheme_id);
    }
  };

  // Border colors selector for cards
  const getCardStyle = (index) => {
    const styles = [
      { text: 'text-amber-500', border: 'hover:border-amber-500/40 border-t-amber-500', bg: 'bg-amber-500/10' },
      { text: 'text-emerald-500', border: 'hover:border-emerald-500/40 border-t-emerald-500', bg: 'bg-emerald-500/10' },
      { text: 'text-purple-500', border: 'hover:border-purple-500/40 border-t-purple-500', bg: 'bg-purple-500/10' }
    ];
    return styles[index % styles.length];
  };

  return (
    <div
      className="min-h-screen flex text-slate-900 overflow-hidden bg-slate-50"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <Sidebar activePage="explore" onVoiceCommand={handleVoiceCommand} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md">
          {/* Linked Search */}
          <div className="relative w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams({ q: e.target.value });
              }}
              placeholder={t('explore.searchPlaceholder')}
              className="w-full bg-slate-100 border border-slate-300 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="relative">
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-8 space-y-8">
          {/* Header titles */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
                {t('explore.title')} <Sparkles className="w-5 h-5 text-amber-500" />
              </h1>
              <p className="text-sm text-slate-500 mt-1">{t('explore.subtitle')}</p>
            </div>
          </div>

          {/* Interactive Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('explore.welfareSchemes'), value: '3,390+', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/5' },
              { label: t('explore.statesCovered'), value: t('explore.statesCoveredVal'), icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/5' },
              { label: t('explore.activeMinistries'), value: t('explore.activeMinistriesVal'), icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/5' },
              { label: t('explore.monthlyVisitors'), value: '50,000+', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/5' }
            ].map((stat, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-4 shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ministry / Category Widget Grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> {t('explore.browseByDept')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {EXPLORE_CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat.value;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(isActive ? '' : cat.value)}
                    className={`p-5 rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.gradient} cursor-pointer transition-all duration-300 hover:scale-[1.03] flex flex-col justify-between h-28 relative overflow-hidden group ${
                      isActive ? 'ring-2 ring-amber-500 border-transparent shadow-lg shadow-amber-500/10' : ''
                    }`}
                  >
                    <div className="absolute right-2 -bottom-2 text-5xl opacity-10 group-hover:scale-110 transition-transform select-none">
                      {cat.icon}
                    </div>
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-bold leading-snug text-slate-800 transition-colors">
                      {t(`myschemes.categories.${cat.id}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schemes results feed */}
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
              <span className="text-xs text-slate-500 uppercase font-semibold">{t('dashboard.loadingMatches')}</span>
            </div>
          ) : schemes.length === 0 ? (
            <div className="rounded-2xl p-16 text-center border border-slate-200 bg-white">
              <p className="text-sm font-semibold text-slate-500">{t('explore.noSchemesExplore')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('explore.noSchemesExploreSub')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getSortedList(schemes).map((scheme, index) => {
                const colors = getCardStyle(index);
                const isExpanded = expandedSchemeId === scheme.scheme_id;
                const isSpeaking = speakingSchemeId === scheme.scheme_id;

                return (
                  <div
                    key={`${scheme.scheme_id}-${index}`}
                    onClick={() => handleSchemeClick(scheme)}
                    className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 hover:shadow-md relative group h-full border-t-4 ${colors.border} overflow-hidden`}
                  >
                    {/* Subtle Watermark Background Image */}
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-[0.08] transition-all group-hover:scale-105 duration-500" 
                      style={{ backgroundImage: `url(${getCategoryBgImage(scheme.schemeCategory)})` }} 
                    />

                    <div className="flex flex-col gap-4 flex-grow mb-5 relative z-10">
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
                              : `${colors.bg} hover:bg-slate-200`
                          }`}
                        >
                          <Bookmark 
                            className="w-5 h-5" 
                            style={{ color: isBookmarked(scheme.scheme_id) ? '#ffffff' : colors.text }} 
                            fill={isBookmarked(scheme.scheme_id) ? '#ffffff' : 'none'}
                          />
                        </button>
                        <span className="bg-[#E98A15]/10 text-[#E98A15] text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                          {scheme.level || 'Central'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-500 transition-colors">
                          {scheme.scheme_name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {scheme.schemeCategory || 'Explore Portal'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 mt-auto">
                        <div className="truncate pr-2">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{t('dashboard.benefitLabel')}</p>
                          <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{scheme.benefits || t('dashboard.checkDetails')}</p>
                        </div>
                        
                        <button
                          onClick={(e) => handleSpeak(scheme, e)}
                          className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSpeaking 
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

                    {/* Action buttons */}
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
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
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

