import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Configure axios global interceptor to inject JWT bearer tokens
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sahayak_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function AuthLoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #E98A15, #F0A23E)', boxShadow: '0 6px 30px rgba(233,138,21,0.45)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div
          className="w-7 h-7 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(233,138,21,0.3)', borderTopColor: '#E98A15' }}
        />
      </div>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading, null = signed out, object = user profile

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile`);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // If unauthorized, clear token and log out
      if (err.response && err.response.status === 401) {
        logoutLocal();
      } else {
        setCurrentUser(null);
      }
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('sahayak_token');
    setCurrentUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('sahayak_token');
    if (token) {
      fetchProfile();
    } else {
      setCurrentUser(null);
    }
  }, []);

  const register = async (email, password, fullName) => {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
      full_name: fullName,
      email,
      password,
    });
    const { access_token } = response.data;
    localStorage.setItem('sahayak_token', access_token);
    return await fetchProfile();
  };

  const signIn = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    const { access_token } = response.data;
    localStorage.setItem('sahayak_token', access_token);
    return await fetchProfile();
  };

  const signOut = async () => {
    logoutLocal();
  };

  const updateProfile = async (profileData) => {
    const response = await axios.put(`${API_BASE_URL}/profile`, profileData);
    setCurrentUser(response.data);
    return response.data;
  };

  const value = useMemo(
    () => ({ currentUser, register, signIn, signOut, updateProfile, fetchProfile }),
    [currentUser]
  );

  if (currentUser === undefined) return <AuthLoadingScreen />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
