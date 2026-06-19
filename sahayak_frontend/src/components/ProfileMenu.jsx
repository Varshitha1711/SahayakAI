import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── Helpers ────────────────────────────────────── */
function getInitial(user) {
  if (user?.full_name) return user.full_name[0].toUpperCase();
  if (user?.email)     return user.email[0].toUpperCase();
  return '?';
}
function truncate(str, max = 26) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/* ── Menu config ────────────────────────────────── */
const MENU_ITEMS = [
  {
    id: 'profile',
    label: 'Edit Profile',
    route: '/profile',
    danger: false,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'help',
    label: 'Help & Support',
    route: '/help',
    danger: false,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'signout',
    label: 'Sign Out',
    route: null,
    danger: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  },
];

/* ── Main component ─────────────────────────────── */
export default function ProfileMenu() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen]             = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef                     = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
      setSigningOut(false);
    }
  };

  const handleItem = (item) => {
    if (item.id === 'signout') { handleSignOut(); return; }
    setOpen(false);
    navigate(item.route);
  };

  if (!currentUser) return null;

  const initial = getInitial(currentUser);
  const name    = currentUser.full_name || 'My Account';
  const email   = truncate(currentUser.email);

  return (
    <div className="relative" ref={menuRef}>

      {/* ── Avatar trigger ── */}
      <button
        id="profile-menu-btn"
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none group"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 select-none transition-transform duration-150 group-hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 4px 16px rgba(233,138,21,0.45)' }}
        >
          {signingOut ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
              <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round"/>
            </svg>
          ) : initial}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: '#0F1B30',
            border: '1.5px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)',
            transformOrigin: 'top right',
            animation: 'ninja-scroll 0.25s cubic-bezier(0.16,1,0.3,1) both',
          }}
          role="menu"
        >
          {/* User header */}
          <div
            className="px-4 py-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 4px 12px rgba(233,138,21,0.4)' }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{name}</p>
              <p className="text-xs text-indigo-400 truncate mt-0.5">{email}</p>
            </div>
          </div>

          {/* Items */}
          <div className="py-1.5">
            {MENU_ITEMS.map((item, i) => (
              <div key={item.id}>
                {item.danger && i > 0 && (
                  <div className="h-px mx-3 my-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                )}
                <button
                  type="button"
                  role="menuitem"
                  id={`profile-menu-${item.id}`}
                  disabled={item.id === 'signout' && signingOut}
                  onClick={() => handleItem(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: item.danger ? '#F87171' : 'rgba(255,255,255,0.85)' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.background = item.danger
                        ? 'rgba(239,68,68,0.12)'
                        : 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {item.id === 'signout' && signingOut ? (
                    <svg className="animate-spin w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <span style={{ color: item.danger ? '#F87171' : '#93A5BF', opacity: 0.9 }}>
                      {item.icon}
                    </span>
                  )}
                  {item.id === 'signout' && signingOut ? 'Signing out…' : item.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
