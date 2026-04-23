// App.jsx — route map. Route structure mirrors our auth gating:
//   public:        /, /signin, /signup
//   authed only:   /onboarding/*  (wrapped in ProtectedRoute)
//   fully onboarded + app chrome:  everything under StatusGate + AppShell
//   admin:         /admin/* (wrapped in AdminRoute)

import { Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import StatusGate from './components/auth/StatusGate.jsx';
import AdminRoute from './components/auth/AdminRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

import Landing from './pages/Landing.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';

import Payment from './pages/onboarding/Payment.jsx';
import CultureCallPending from './pages/onboarding/CultureCallPending.jsx';
import Rejected from './pages/onboarding/Rejected.jsx';
import BackgroundCheck from './pages/onboarding/BackgroundCheck.jsx';
import ProfileSetup from './pages/onboarding/ProfileSetup.jsx';

import Home from './pages/Home.jsx';
import Directory from './pages/Directory.jsx';
import MemberProfile from './pages/MemberProfile.jsx';
import Deals from './pages/Deals.jsx';
import DealDetail from './pages/DealDetail.jsx';
import MyProfile from './pages/MyProfile.jsx';

import AdminHome from './pages/admin/AdminHome.jsx';
import PendingMembers from './pages/admin/PendingMembers.jsx';
import AllDeals from './pages/admin/AllDeals.jsx';
import AllMembers from './pages/admin/AllMembers.jsx';

import { useAuth } from './contexts/AuthContext.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Landing decides between "show splash" and "send to app" based on auth.
function RootSwitch() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Starting up..." />;
  if (!user) return <Landing />;
  // Signed-in users fall through to the main app routes below.
  return null;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="Starting up..." />;

  return (
    <Routes>
      {/* Public */}
      {!user ? (
        <>
          <Route path="/" element={<RootSwitch />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<SignIn />} />
        </>
      ) : (
        <>
          {/* Onboarding (authed, but not yet fully set up) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding/payment" element={<Payment />} />
            <Route path="/onboarding/pending" element={<CultureCallPending />} />
            <Route path="/onboarding/rejected" element={<Rejected />} />
            <Route path="/onboarding/background-check" element={<BackgroundCheck />} />
            <Route path="/onboarding/profile" element={<ProfileSetup />} />
          </Route>

          {/* Fully onboarded — wrapped in AppShell chrome */}
          <Route element={<ProtectedRoute />}>
            <Route element={<StatusGate />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Directory />} />
                <Route path="/members/:memberId" element={<MemberProfile />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:dealId" element={<DealDetail />} />
                <Route path="/me" element={<MyProfile />} />

                {/* Admin */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminHome />} />
                  <Route path="/admin/pending" element={<PendingMembers />} />
                  <Route path="/admin/deals" element={<AllDeals />} />
                  <Route path="/admin/members" element={<AllMembers />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Auth pages are redundant while signed in but keep the links working. */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<RootSwitch />} />
        </>
      )}
    </Routes>
  );
}
