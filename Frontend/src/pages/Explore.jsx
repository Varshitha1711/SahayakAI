import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Search, Bell, Bookmark, Volume2, VolumeX, ArrowRight, 
  Sparkles, Award, Users, Globe, Building2, Eye, Compass, LayoutGrid
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';
import { speakText, stopSpeaking } from '../components/VoiceAssistant';

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
const TARGET_GROUPS = [
  { label: 'All Citizens', value: '' },
  { label: 'Farmers', value: 'Farmer' },
  { label: 'Students', value: 'Student' },
  { label: 'Entrepreneurs', value: 'Entrepreneur' },
  { label: 'Unemployed', value: 'Unemployed' },
  { label: 'Retired', value: 'Retired' }
];

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
  const [targetGroup, setTargetGroup] = useState('');
  const [schemeLevel, setSchemeLevel] = useState(''); // 'Central' | 'State' | ''
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [speakingSchemeId, setSpeakingSchemeId] = useState(null);
  const [schemeDetails, setSchemeDetails] = useState({});

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
          level: schemeLevel || undefined,
          q: searchQuery || undefined,
          lang: i18n.language
        }
      });
      
      let filtered = response.data;
      
      // Client-side additional target-group filter matching
      if (targetGroup) {
        const tgt = targetGroup.toLowerCase();
        filtered = filtered.filter(s => {
          const tags = (s.tags || '').toLowerCase();
          const name = (s.scheme_name || '').toLowerCase();
          const details = (s.details || '').toLowerCase();
          const eligibility = (s.eligibility || '').toLowerCase();
          return tags.includes(tgt) || name.includes(tgt) || details.includes(tgt) || eligibility.includes(tgt);
        });
      }

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
  }, [currentUser, searchQuery, selectedCategory, targetGroup, schemeLevel, i18n.language]);

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
      className="min-h-screen flex text-white overflow-hidden bg-[#060E1C]"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      <Sidebar activePage="explore" onVoiceCommand={handleVoiceCommand} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#060E1C]/85 backdrop-blur-md">
          {/* Linked Search */}
          <div className="relative w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams({ q: e.target.value });
              }}
              placeholder="Search by keywords, tags..."
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
          {/* Header titles */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                Explore Schemes <Sparkles className="w-5 h-5 text-amber-400" />
              </h1>
              <p className="text-sm text-indigo-300/60 mt-1">Discover government policies, awards, subsidies, and central grants</p>
            </div>
          </div>

          {/* Interactive Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Welfare Schemes', value: '3,390+', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/5' },
              { label: 'States & UTs', value: '37 Covered', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/5' },
              { label: 'Active Ministries', value: '15+ Depts', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/5' },
              { label: 'Monthly Visitors', value: '50,000+', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/5' }
            ].map((stat, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex items-center gap-4 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">{stat.value}</p>
                  <p className="text-[10px] font-medium text-indigo-300/40 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ministry / Category Widget Grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Browse by Department
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
                    <span className="text-xs font-bold leading-snug group-hover:text-white transition-colors">
                      {cat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtering row */}
          <div className="space-y-4 pt-2">
            {/* Target groups */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
              <span className="text-[10px] font-bold text-indigo-300/40 uppercase tracking-wider mr-2">Target Citizen:</span>
              {TARGET_GROUPS.map(grp => {
                const isActive = targetGroup === grp.value;
                return (
                  <button
                    key={grp.label}
                    onClick={() => setTargetGroup(grp.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isActive 
                        ? 'bg-amber-500 text-black border-amber-500 font-bold' 
                        : 'border-white/10 text-indigo-300 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    {grp.label}
                  </button>
                );
              })}
            </div>

            {/* Scheme level */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-white">
                {selectedCategory || searchQuery || targetGroup || schemeLevel 
                  ? 'Filtered Search Results' 
                  : 'Trending Government Schemes'}
              </h2>

              <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
                {[
                  { label: 'All Schemes', value: '' },
                  { label: 'Central', value: 'Central' },
                  { label: 'State', value: 'State' }
                ].map(level => {
                  const isActive = schemeLevel === level.value;
                  return (
                    <button
                      key={level.label}
                      onClick={() => setSchemeLevel(level.value)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        isActive ? 'bg-[#E98A15] text-black font-extrabold shadow-sm' : 'text-indigo-300/60 hover:text-white'
                      }`}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Schemes results feed */}
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }} />
              <span className="text-xs text-indigo-300/60 uppercase font-semibold">Filtering Matches...</span>
            </div>
          ) : schemes.length === 0 ? (
            <div className="rounded-2xl p-16 text-center border border-white/5 bg-white/[0.01]">
              <p className="text-sm font-semibold text-indigo-300/60">No schemes matching explore filters</p>
              <p className="text-xs text-indigo-300/40 mt-1">Try clearing some query inputs or filter tags.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {schemes.map((scheme, index) => {
                const colors = getCardStyle(index);
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
                        <span className="bg-[#E98A15]/10 text-[#E98A15] text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                          {scheme.level || 'Central'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-amber-400 transition-colors">
                          {scheme.scheme_name}
                        </h3>
                        <p className="text-xs text-indigo-300/40 line-clamp-1">
                          {scheme.schemeCategory || 'Explore Portal'}
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

                    {/* Collapsible details */}
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
        </main>
      </div>
    </div>
  );
}
