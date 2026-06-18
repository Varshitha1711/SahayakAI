import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Home                from '../pages/Home';
import SignIn              from '../pages/SignIn';
import SignUp              from '../pages/SignUp';
import Onboarding          from '../pages/onboarding';
import Dashboard           from '../pages/Dashboard';
import EditProfile         from '../pages/EditProfile';
import HelpSupport         from '../pages/HelpSupport';
import MySchemes           from '../pages/MySchemes';
import Explore             from '../pages/Explore';
import Settings            from '../pages/Settings';

export default function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Root: Dashboard if logged in, else landing page */}
      <Route path="/" element={currentUser ? <Dashboard /> : <Home />} />

      {/* Auth routes — redirect to dashboard if already logged in */}
      <Route path="/signin"  element={currentUser ? <Navigate to="/" replace /> : <SignIn />} />
      <Route path="/signup"  element={currentUser ? <Navigate to="/" replace /> : <SignUp />} />

      {/* Onboarding profile builder */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Edit Profile (logged-in users) */}
      <Route path="/profile" element={<EditProfile />} />

      {/* Help & Support */}
      <Route path="/help" element={<HelpSupport />} />


      {/* My Schemes (all schemes) */}
      <Route path="/my-schemes" element={<MySchemes />} />

      {/* Explore Schemes */}
      <Route path="/explore" element={<Explore />} />

      {/* Settings */}
      <Route path="/settings" element={<Settings />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}