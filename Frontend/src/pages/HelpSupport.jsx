import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Sparkles, Bot, Send, ArrowRight
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
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const chatContainerRef = useRef(null);

  // Auto scroll to chat bottom (only within the chatbot container)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isChatLoading]);

  const triggerChatSubmit = async (text) => {
    setChatHistory(prev => [...prev, { role: 'user', content: text }]);
    setIsChatLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/`, {
        question: text
      });
      setChatHistory(prev => [...prev, { role: 'ai', content: response.data.answer }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { role: 'ai', content: t('help.errorAI') }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    triggerChatSubmit(text);
  };

  const handleSuggestedClick = (text) => {
    triggerChatSubmit(text);
  };

  const SUGGESTED_QUESTIONS = [
    { text: t('help.suggested1'), icon: '🎓' },
    { text: t('help.suggested2'), icon: '🌾' },
    { text: t('help.suggested3'), icon: '🏥' }
  ];

  return (
    <div
      className="min-h-screen flex text-slate-900 overflow-hidden bg-slate-50"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <Sidebar activePage="help" />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-white border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              {t('common.back')}
            </button>
            <h1 className="font-display text-sm font-bold text-slate-900">{t('help.title')}</h1>
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
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col">
            {/* Chatbot Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-none">Sahayak AI</h3>
                  <div className="flex items-center gap-1.5 mt-1 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            {/* Chat History / Prompt Panel */}
            <div
              ref={chatContainerRef}
              className="p-5 bg-slate-50 flex flex-col gap-4 max-h-[360px] overflow-y-auto min-h-[160px] border-b border-slate-100"
              style={{ scrollbarWidth: 'thin' }}
            >
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <p className="text-3xl">🤝</p>
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-900">{t('help.heading')}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{t('help.subheading')}</p>
                  </div>

                  {/* Suggested questions shortcuts */}
                  <div className="w-full max-w-lg space-y-2 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left px-1">{t('help.suggestedTitle')}</p>
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedClick(q.text)}
                        className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-500/5 transition-all text-xs text-slate-700 font-semibold flex items-center justify-between group"
                      >
                        <span className="flex items-center gap-2">
                          <span>{q.icon}</span>
                          <span>{q.text}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-white self-end rounded-tr-none shadow-sm'
                          : 'bg-white text-slate-800 self-start rounded-tl-none border border-slate-200 shadow-sm'
                      }`}
                    >
                      <span
                        className={`font-bold text-[8px] uppercase tracking-widest block mb-1 ${
                          msg.role === 'user' ? 'text-amber-100' : 'text-amber-500'
                        }`}
                      >
                        {msg.role === 'user' ? 'You' : 'Sahayak AI'}
                      </span>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isChatLoading && (
                    <div className="bg-white text-slate-800 self-start rounded-2xl rounded-tl-none border border-slate-200 shadow-sm p-3.5 max-w-[85%] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Footer Area */}
            <div className="p-3 bg-white flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleChatSubmit()}
                placeholder={t('help.chatPlaceholder')}
                disabled={isChatLoading}
                className="bg-slate-50 text-xs text-slate-900 placeholder-slate-400 outline-none flex-1 py-3 px-4 rounded-xl border border-slate-200 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
              />
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isChatLoading}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 transition-colors flex items-center justify-center text-white cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contact options */}
          <section className="animate-fade-up">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t('help.contactSection')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTACT.map((c) => (
                <div
                  key={c.title}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-xs font-bold text-slate-900">{c.title}</p>
                  <p className="text-xs font-semibold" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-[10px] text-slate-500">{c.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="animate-fade-up">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t('help.faqSection')}</h3>
            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm"
                >
                  <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none text-sm font-semibold text-slate-800 select-none hover:bg-slate-50 transition-colors">
                    {item.q}
                    <svg
                      className="w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </summary>
                  <p
                    className="px-5 pb-4 pt-2 text-sm text-slate-600 leading-relaxed border-t border-slate-100"
                  >
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Quick links */}
          <section className="animate-fade-up pb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t('help.quickLinks')}</h3>
            <div className="flex flex-wrap gap-2">
              {['Report a Bug', 'Privacy Policy', 'Terms of Service', 'About Sahayak'].map((link) => (
                <button
                  key={link}
                  type="button"
                  className="text-xs font-semibold px-4 py-2 rounded-full text-slate-600 hover:text-slate-800 transition-colors bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
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
