import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Home from '../pages/Home';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Onboarding from '../pages/Onboarding';
import Dashboard from '../pages/Dashboard';
import DocumentVerification from '../pages/DocumentVerification';

export default function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Root path renders Dashboard if logged in, otherwise renders public Home landing page */}
      <Route path="/" element={currentUser ? <Dashboard /> : <Home />} />
      
      {/* Auth routes (redirect to dashboard if already authenticated) */}
      <Route path="/signin" element={currentUser ? <Navigate to="/" replace /> : <SignIn />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <SignUp />} />
      
      {/* Onboarding profile builder */}
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Secure document verification upload vault */}
      <Route path="/documents" element={<DocumentVerification />} />
      
      {/* Catch-all redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}