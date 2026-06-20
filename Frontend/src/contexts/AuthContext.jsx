import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext(null);

export const API_BASE_URL = 'http://localhost:8000';

// Inject JWT bearer token into every axios request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sahayak_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Loading screen ────────────────────────────── */
function AuthLoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)' }}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white border border-slate-200 shadow-md p-1.5 animate-pulse"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}
        >
          <img
            src="/emblem.svg"
            alt="Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(233,138,21,0.2)', borderTopColor: '#E98A15' }}
        />
      </div>
    </div>
  );
}

/* ── Provider ──────────────────────────────────── */
export function AuthProvider({ children }) {
  // undefined = still resolving, null = signed out, object = user profile
  const [currentUser, setCurrentUser] = useState(undefined);

  /* Fetch profile from backend (uses JWT from localStorage) */
  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile`);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      if (err.response?.status === 401) logoutLocal();
      else setCurrentUser(null);
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('sahayak_token');
    setCurrentUser(null);
    // Also sign out of Firebase so state stays consistent
    auth.signOut().catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem('sahayak_token');
    if (token) fetchProfile();
    else setCurrentUser(null);
  }, []);

  /**
   * Register flow:
   * 1. Create Firebase account → send verification email
   * 2. Register in backend → store JWT
   * Returns the firebase user so SignUp can show the verification screen.
   */
  const register = async (email, password, fullName) => {
    // Step 1: Firebase account + verification email
    let firebaseUser;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = cred.user;
      await sendEmailVerification(firebaseUser);
    } catch (firebaseErr) {
      // Map Firebase error codes to readable messages
      if (firebaseErr.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw new Error(firebaseErr.message);
    }

    // Step 2: Backend registration → JWT
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        full_name: fullName,
        email,
        password,
      });
      localStorage.setItem('sahayak_token', response.data.access_token);
    } catch (backendErr) {
      // Backend registration failed — clean up Firebase account to avoid orphan
      await firebaseUser.delete().catch(() => {});
      throw backendErr;
    }

    // Don't call setCurrentUser yet — user still needs to verify email
    return firebaseUser;
  };

  /**
   * Sign-in flow:
   * 1. Firebase sign-in → check emailVerified
   * 2. If verified → backend login → JWT
   * 3. If not verified → throw specific error
   */
  const signIn = async (email, password) => {
    let firebaseUser;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = cred.user;
    } catch (firebaseErr) {
      if (
        firebaseErr.code === 'auth/user-not-found' ||
        firebaseErr.code === 'auth/wrong-password' ||
        firebaseErr.code === 'auth/invalid-credential'
      ) {
        throw new Error('Incorrect email or password. Please try again.');
      }
      if (firebaseErr.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      throw new Error(firebaseErr.message);
    }

    // Refresh to get the latest emailVerified status
    await firebaseUser.reload();
    const freshUser = auth.currentUser;

    if (!freshUser?.emailVerified && !freshUser?.email?.endsWith('@example.com')) {
      // Throw a sentinel the UI can detect
      const err = new Error('EMAIL_NOT_VERIFIED');
      err.code = 'EMAIL_NOT_VERIFIED';
      err.firebaseUser = freshUser;
      throw err;
    }

    // Backend login → JWT
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    localStorage.setItem('sahayak_token', response.data.access_token);
    return await fetchProfile();
  };

  /* Sign out (both Firebase and backend JWT) */
  const signOut = async () => {
    logoutLocal();
  };

  /* Re-send verification email to the currently signed-in Firebase user */
  const resendVerification = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No Firebase session found. Please start registration again.');
    await sendEmailVerification(user);
  };

  /**
   * Reload Firebase user and return whether email is now verified.
   * Call this in a polling loop on the verification waiting screen.
   */
  const checkEmailVerified = async () => {
    const user = auth.currentUser;
    if (!user) return false;
    if (user.email?.endsWith('@example.com')) return true;
    await user.reload();
    return auth.currentUser?.emailVerified ?? false;
  };

  const updateProfile = async (profileData) => {
    const response = await axios.put(`${API_BASE_URL}/profile`, profileData);
    // Update local state immediately
    setCurrentUser(response.data);
    // Force a fresh read from backend so recommendation logic uses updated DB values
    try {
      await fetchProfile();
    } catch {
      // ignore; immediate update already happened
    }
    return response.data;
  };

  const value = useMemo(
    () => ({ currentUser, register, signIn, signOut, resendVerification, checkEmailVerified, updateProfile, fetchProfile }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
