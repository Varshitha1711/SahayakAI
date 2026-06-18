import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Bell, ChevronDown, ChevronUp, Bookmark, 
  Volume2, VolumeX, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';
import { speakText, stopSpeaking } from '../components/VoiceAssistant';

export default function MySchemes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State variables
  const [schemes, setSchemes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [speakingSchemeId, setSpeakingSchemeId] = useState(null);
  const [schemeDetails, setSchemeDetails] = useState({});

  // Categories list based on datasets
  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Agriculture, Rural & Environment', value: 'Agriculture, Rural & Environment' },
    { label: 'Education & Learning', value: 'Education & Learning' },
    { label: 'Health & Wellness', value: 'Health & Wellness' },
    { label: 'Banking, Financial Services & Insurance', value: 'Banking, Financial Services & Insurance' },
    { label: 'Social Welfare & Empowerment', value: 'Social Welfare & Empowerment' },
    { label: 'Women & Child', value: 'Women & Child' },
    { label: 'Business & Entrepreneurship', value: 'Business & Entrepreneurship' }
  ];

  // Fetch schemes from backend
  const fetchSchemes = async (pageNum, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/schemes/recommendations`, {
        params: {
          page: pageNum,
          limit: 20,
          category: selectedCategory || undefined,
          q: searchQuery || undefined,
          lang: i18n.language
        }
      });

      const fetchedData = response.data;
      if (fetchedData.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setSchemes(prev => [...prev, ...fetchedData]);
      } else {
        setSchemes(fetchedData);
      }
    } catch (err) {
      console.error('Failed to load all schemes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger search and filter resets
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    setPage(1);
    setSchemes([]);
    setSchemeDetails({});
    fetchSchemes(1, false);
  }, [currentUser, searchQuery, selectedCategory, i18n.language]);

  // Load more handler
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSchemes(nextPage, true);
  };

  // Track clicked schemes (unique visited counter)
  const handleSchemeClick = async (scheme) => {
    const isExpanding = expandedSchemeId !== scheme.scheme_id;
    setExpandedSchemeId(isExpanding ? scheme.scheme_id : null);

    // Visited tracking inside localStorage
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
        console.error('Failed to load scheme details:', err);
      }
    }
  };

  // TTS Controls
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

  // Scheme colors helper
  const getSchemeColors = (index) => {
    const colors = [
      { border: 'border-t-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
      { border: 'border-t-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { border: 'border-t-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div
      className="min-h-screen flex text-white overflow-hidden bg-[#060E1C]"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      <Sidebar activePage="my-schemes" />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#060E1C]/85 backdrop-blur-md">
          {/* Search */}
          <div className="relative w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all schemes..."
              className="w-full bg-[#111A2E]/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white/[0.03] text-white"
            />
            <Search className="w-4 h-4 text-indigo-300/40 absolute left-3.5 top-3" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <button className="relative p-1.5 text-indigo-300/60 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="relative">
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-white">My Schemes</h1>
              <p className="text-sm text-indigo-300/60 mt-1">Browse all available government schemes in our directory</p>
            </div>
            
            {/* Category dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#111A2E]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none cursor-pointer focus:border-amber-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-[#0F1B30] text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schemes Content */}
          {loading ? (
            <div className="flex flex-col items-center py-24 gap-3">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
              <span className="text-xs text-indigo-300/60 uppercase font-semibold">Loading schemes...</span>
            </div>
          ) : schemes.length === 0 ? (
            <div className="rounded-2xl p-16 text-center border border-white/5 bg-white/[0.01] space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-indigo-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">No Schemes Found</h3>
                <p className="text-indigo-300/50 text-xs mt-1">Try expanding your search parameters or category filter.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((scheme, index) => {
                const colors = getSchemeColors(index);
                const isExpanded = expandedSchemeId === scheme.scheme_id;
                const isSpeaking = speakingSchemeId === scheme.scheme_id;

                return (
                  <div
                    key={`${scheme.scheme_id}-${index}`}
                    onClick={() => handleSchemeClick(scheme)}
                    className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] relative group h-full border-t-4 ${colors.border}`}
                  >
                    <div className="flex flex-col gap-4 flex-grow mb-5">
                      <div className="flex justify-between items-start">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                          <Bookmark className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                          Available <Layers className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-amber-400 transition-colors">
                          {scheme.scheme_name}
                        </h3>
                        <p className="text-xs text-indigo-300/40 line-clamp-1">
                          {scheme.schemeCategory || "Government Scheme"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center bg-[#070F1E] p-3 rounded-xl border border-white/5 mt-auto">
                        <div className="truncate pr-2">
                          <p className="text-[9px] text-indigo-300/40 uppercase tracking-wider">Benefit</p>
                          <p className="text-xs font-bold text-white mt-0.5 truncate">{scheme.benefits || 'Check Details'}</p>
                        </div>
                        
                        <button
                          onClick={(e) => handleSpeak(scheme, e)}
                          className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSpeaking 
                              ? 'bg-amber-500 border-amber-500 text-white animate-pulse' 
                              : 'bg-white/5 border-white/10 hover:border-amber-500/50 text-indigo-300 hover:text-amber-400'
                          }`}
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div className="mb-4 pt-2 border-t border-white/5 space-y-4 text-xs text-indigo-200/80 animate-fade-in">
                        {!schemeDetails[scheme.scheme_id] ? (
                          <div className="flex items-center gap-2 py-4 justify-center text-indigo-300/60 font-semibold">
                            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
                            <span>Loading details...</span>
                          </div>
                        ) : (
                          <>
                            {schemeDetails[scheme.scheme_id].details && (
                              <div>
                                <h4 className="font-bold text-white mb-1 uppercase tracking-wide text-[9px] text-amber-500">Scheme Details</h4>
                                <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].details}</p>
                              </div>
                            )}
                            
                            {schemeDetails[scheme.scheme_id].eligibility && (
                              <div>
                                <h4 className="font-bold text-white mb-1 uppercase tracking-wide text-[9px] text-amber-500">Eligibility Criteria</h4>
                                <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].eligibility}</p>
                              </div>
                            )}

                            {schemeDetails[scheme.scheme_id].documents && (
                              <div>
                                <h4 className="font-bold text-white mb-1 uppercase tracking-wide text-[9px] text-amber-500">Required Documents</h4>
                                <p className="leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">{schemeDetails[scheme.scheme_id].documents}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2.5 mt-auto pt-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSchemeClick(scheme);
                        }}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-xs font-semibold text-indigo-200 hover:bg-white/5 transition-all text-center"
                      >
                        {isExpanded ? 'Less Info' : 'Learn More'}
                      </button>
                      
                      <a
                        href={`https://www.myscheme.gov.in/schemes/${scheme.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2 rounded-lg bg-white/[0.05] border border-white/10 hover:border-amber-500/30 text-xs font-semibold text-amber-400 hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        Apply Online <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && schemes.length > 0 && !loading && (
            <div className="flex justify-center pt-4 pb-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-xl border border-white/10 text-sm font-semibold hover:border-amber-500/50 hover:bg-white/[0.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#FFF' }} />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Schemes
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
