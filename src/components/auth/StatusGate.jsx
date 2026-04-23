// StatusGate — routes new members through the 3-step onboarding flow and
// then drops them into the app, regardless of approval status.
//
// Flow:
//   1. Welcome   (/onboarding/welcome)        until welcomeSeen
//   2. Application (/onboarding/application)  until status moves off 'unpaid'
//   3. Profile   (/onboarding/profile)        until profileComplete
//   -> Main app (read-only until status === 'approved')
//
// "Pending" is NOT a blocking wall anymore — pending members land in the app
// with engagement actions softly locked. Only "rejected" still redirects.
//
// Admins bypass onboarding entirely.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';
import { MEMBER_STATUS } from '../../lib/constants.js';

const ONBOARDING_PATHS = new Set([
  '/onboarding/welcome',
  '/onboarding/application',
  '/onboarding/profile',
  '/onboarding/rejected',
]);

function decideDestination(userDoc, { isAdmin }) {
  if (isAdmin) return null;
  if (userDoc.status === MEMBER_STATUS.REJECTED) return '/onboarding/rejected';
  if (!userDoc.welcomeSeen) return '/onboarding/welcome';
  if (userDoc.status === MEMBER_STATUS.UNPAID) return '/onboarding/application';
  if (!userDoc.profileComplete) return '/onboarding/profile';
  return null;
}

export default function StatusGate() {
  const { userDoc, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading || !userDoc) return <Spinner label="Checking your status..." />;

  const destination = decideDestination(userDoc, { isAdmin });
  const onOnboarding = ONBOARDING_PATHS.has(location.pathname);

  // Fully onboarded but visiting an onboarding page -> send home.
  if (!destination && onOnboarding) {
    return <Navigate to="/" replace />;
  }
  // Needs onboarding and they're not on the right page -> redirect.
  if (destination && location.pathname !== destination) {
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
