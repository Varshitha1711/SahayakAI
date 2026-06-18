import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  User, ClipboardCheck, HelpCircle, LayoutDashboard, Compass, Settings,
  Bell, ChevronLeft, ChevronRight, Bookmark, ArrowRight
} from 'lucide-react';
import { API_BASE_URL, useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProfileMenu from '../components/ProfileMenu';
import Sidebar from '../components/Sidebar';

const FAQ = [
  {
    q: 'How does Sahayak match me with schemes?',
    a: 'We use your onboarding profile — age, location, income, occupation, category — to automatically surface government schemes you are eligible for.',
  },
  {
    q: 'Can I update my profile after onboarding?',
    a: 'Yes! Click the profile avatar in the top-right corner and choose "Edit Profile". Your scheme recommendations refresh automatically.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Your data is stored securely and is only used to match you with relevant government schemes. We never share it with third parties.',
  },
  {
    q: 'How do I apply for a scheme?',
    a: 'Click on any scheme card on the dashboard to expand it. The "How to Apply" section will guide you to the official government portal.',
  },
  {
    q: 'Why are some schemes not showing up?',
    a: 'Scheme eligibility is based on your profile. Try completing all fields in Edit Profile to improve your match accuracy.',
  },
];

const CONTACT = [
  { icon: '📧', title: 'Email Support', value: 'support@sahayak.in', sub: 'Response within 24 hours', color: '#3B82F6' },
  { icon: '💬', title: 'WhatsApp', value: '+91 99999 99999', sub: 'Mon–Fri, 9 am – 6 pm IST', color: '#25D366' },
  { icon: '📞', title: 'Helpline', value: '1800-XXX-XXXX', sub: 'Toll-free · Available 24 × 7', color: '#E98A15' },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/`, {
        question: userMessage
      });
      setChatHistory(prev => [...prev, { role: 'ai', content: response.data.answer }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error connecting to the AI server. Please try again later.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex text-white overflow-hidden bg-[#060E1C]"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      <Sidebar activePage="help" />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#060E1C]/85 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <h1 className="font-display text-sm font-bold text-white">Help &amp; Support</h1>
          </div>

          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="relative">
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* ── Main Help & Support Body ── */}
        <main className="flex-grow max-w-3xl w-full mx-auto px-8 py-8 space-y-8">
          {/* Chatbot Interface */}
          <div
            className="rounded-2xl p-6 text-center animate-fade-up bg-white/[0.02] border border-white/5"
          >
            <p className="text-4xl mb-3">🤝</p>
            <h2 className="font-display text-xl font-bold text-white mb-1">How can we help you?</h2>
            <p className="text-sm text-indigo-400/80 mb-4">Chat with our AI Assistant to find answers instantly.</p>
            
            <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
               {/* Chat History */}
               {chatHistory.length > 0 && (
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto w-full text-left bg-[#070F1E] rounded-xl p-4 border border-white/5" style={{ scrollbarWidth: 'thin' }}>
                     {chatHistory.map((msg, i) => (
                        <div key={i} className={`p-3.5 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 self-end ml-12 border border-indigo-500/20' : 'bg-white/[0.03] text-white mr-12 border border-white/5'}`}>
                           <span className={`font-bold text-[9px] uppercase tracking-widest opacity-60 block mb-1.5 ${msg.role === 'user' ? 'text-indigo-300' : 'text-amber-400'}`}>
                             {msg.role === 'user' ? 'You' : 'Sahayak AI'}
                           </span>
                           {/* Render formatting or text */}
                           <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                     ))}
                  </div>
               )}

               {/* Input Box */}
               <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl w-full transition-all focus-within:bg-white/[0.05] focus-within:border-amber-500/50"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleChatSubmit()}
                    placeholder="Ask a question about government schemes..."
                    className="bg-transparent text-sm text-white placeholder-indigo-400/60 outline-none flex-1"
                  />
                  <button 
                    onClick={handleChatSubmit} 
                    disabled={!chatInput.trim() || isChatLoading}
                    className="text-amber-500 disabled:opacity-30 hover:text-amber-400 transition-colors"
                  >
                    {isChatLoading ? (
                       <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M22 12a10 10 0 00-10-10" strokeLinecap="round"/></svg>
                    ) : (
                       <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    )}
                  </button>
               </div>
            </div>
          </div>

          {/* Contact options */}
          <section className="animate-fade-up">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Contact Us</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTACT.map((c) => (
                <div
                  key={c.title}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center cursor-pointer transition-all duration-200 hover:-translate-y-1"
                  style={{ background: `${c.color}10`, border: `1.5px solid ${c.color}25` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${c.color}1A`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${c.color}10`; }}
                >
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-xs font-bold text-white">{c.title}</p>
                  <p className="text-xs font-semibold" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-[10px] text-indigo-400">{c.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="animate-fade-up">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.06)' }}
                >
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none text-sm font-semibold text-white select-none hover:bg-white/5 transition-colors">
                    {item.q}
                    <svg
                      className="w-4 h-4 text-indigo-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </summary>
                  <p
                    className="px-5 pb-4 pt-2 text-sm text-indigo-300/80 leading-relaxed"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Quick links */}
          <section className="animate-fade-up pb-8">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Quick Links</h3>
            <div className="flex flex-wrap gap-2">
              {['Report a Bug', 'Privacy Policy', 'Terms of Service', 'About Sahayak'].map((link) => (
                <button
                  key={link}
                  type="button"
                  className="text-xs font-semibold px-4 py-2 rounded-full text-indigo-300 hover:text-white transition-colors animate-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}
                >
                  {link}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
