import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── Helpers ──────────────────────────────── */

/** Get initials from email, e.g. "chaitanya@gmail.com" → "C" */
function getInitial(user) {
  if (user?.displayName) return user.displayName[0].toUpperCase();
  if (user?.email) return user.email[0].toUpperCase();
  return '?';
}

/** Truncate long email for display */
function truncateEmail(email, max = 26) {
  if (!email) return '';
  return email.length > max ? email.slice(0, max) + '…' : email;
}

/* ── Menu items config ────────────────────── */
const MENU_ITEMS = [
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    danger: false,
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    danger: false,
  },
  {
    id: 'signout',
    label: 'Sign Out',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    danger: true,
  },
];

/* ── Main component ───────────────────────── */

export default function ProfileMenu({ darkMode = true }) {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);

  /* Close when clicking outside */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
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
      console.error('Sign out failed:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const handleItem = (id) => {
    if (id === 'signout') {
      handleSignOut();
    }
    // Settings and Help & Support: coming soon — close dropdown for now
    if (id !== 'signout') setOpen(false);
  };

  if (!currentUser) return null;

  const initial = getInitial(currentUser);
  const email = truncateEmail(currentUser.email);

  /* Colour tokens based on context (dark hero vs light auth panel) */
  const avatarStyle = darkMode
    ? { background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 4px 16px rgba(233,138,21,0.45)' }
    : { background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 4px 16px rgba(233,138,21,0.3)' };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        id="profile-menu-btn"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full transition-all duration-200 focus:outline-none"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar circle */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 select-none transition-transform duration-200 hover:scale-105 active:scale-95"
          style={avatarStyle}
        >
          {initial}
        </div>

        {/* Chevron (on dark bg only) */}
        {darkMode && (
          <svg
            className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-64 rounded-2xl overflow-hidden z-50 animate-slide-up"
          style={{
            background: 'white',
            border: '2px solid #EEF2F8',
            boxShadow: '0 20px 60px -10px rgba(15,27,48,0.2), 0 4px 20px rgba(15,27,48,0.08)',
          }}
          role="menu"
          aria-label="Profile options"
        >
          {/* User info header */}
          <div
            className="px-4 py-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #F5F7FC, #EEF2F8)' }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 4px 12px rgba(233,138,21,0.35)' }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">
                {currentUser.displayName || 'My Account'}
              </p>
              <p className="text-xs text-indigo-400 truncate mt-0.5">{email}</p>
              {currentUser.emailVerified && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-green-600">Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-indigo-50" />

          {/* Menu items */}
          <div className="py-1.5">
            {MENU_ITEMS.map((item, i) => (
              <div key={item.id}>
                {/* Divider before Sign Out */}
                {item.danger && i > 0 && <div className="h-px bg-indigo-50 mx-3 my-1" />}

                <button
                  type="button"
                  role="menuitem"
                  id={`profile-menu-${item.id}`}
                  disabled={item.id === 'signout' && signingOut}
                  onClick={() => handleItem(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ color: item.danger ? '#DC2626' : '#1E2A38' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.background = item.danger ? '#FEF2F2' : '#F5F7FC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Icon or spinner for sign-out */}
                  {item.id === 'signout' && signingOut ? (
                    <svg className="animate-spin w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M22 12a10 10 0 00-10-10" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <span style={{ color: item.danger ? '#DC2626' : '#3E5C8A', opacity: 0.8 }}>
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
