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

import Welcome from './pages/onboarding/Welcome.jsx';
import Application from './pages/onboarding/Application.jsx';
import Rejected from './pages/onboarding/Rejected.jsx';
import ProfileSetup from './pages/onboarding/ProfileSetup.jsx';

import Home from './pages/Home.jsx';
import Directory from './pages/Directory.jsx';
import MemberProfile from './pages/MemberProfile.jsx';
import Deals from './pages/Deals.jsx';
import DealDetail from './pages/DealDetail.jsx';
import MyProfile from './pages/MyProfile.jsx';
import Notifications from './pages/Notifications.jsx';
import ReviewWizard from './pages/reviews/ReviewWizard.jsx';
import Matches from './pages/Matches.jsx';
import Bulletin from './pages/Bulletin.jsx';
import BulletinNew from './pages/BulletinNew.jsx';
import BulletinPostDetail from './pages/BulletinPostDetail.jsx';

import AdminHome from './pages/admin/AdminHome.jsx';
import PendingMembers from './pages/admin/PendingMembers.jsx';
import AllDeals from './pages/admin/AllDeals.jsx';
import AllMembers from './pages/admin/AllMembers.jsx';
import AdminReviews from './pages/admin/Reviews.jsx';
import AdminBulletin from './pages/admin/Bulletin.jsx';

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
            <Route element={<StatusGate />}>
              <Route path="/onboarding/welcome" element={<Welcome />} />
              <Route path="/onboarding/application" element={<Application />} />
              <Route path="/onboarding/profile" element={<ProfileSetup />} />
              <Route path="/onboarding/rejected" element={<Rejected />} />
            </Route>
          </Route>

          {/* Fully onboarded — wrapped in AppShell chrome */}
          <Route element={<ProtectedRoute />}>
            <Route element={<StatusGate />}>
              <Route path="/deals/:dealId/review" element={<ReviewWizard />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Directory />} />
                <Route path="/members/:memberId" element={<MemberProfile />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:dealId" element={<DealDetail />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/bulletin" element={<Bulletin />} />
                <Route path="/bulletin/new" element={<BulletinNew />} />
                <Route path="/bulletin/:postId" element={<BulletinPostDetail />} />
                <Route path="/me" element={<MyProfile />} />

                {/* Admin */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminHome />} />
                  <Route path="/admin/pending" element={<PendingMembers />} />
                  <Route path="/admin/deals" element={<AllDeals />} />
                  <Route path="/admin/members" element={<AllMembers />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/bulletin" element={<AdminBulletin />} />
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
