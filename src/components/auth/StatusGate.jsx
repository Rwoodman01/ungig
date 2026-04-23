// StatusGate — implements the onboarding state machine.
// Reads the current users/{uid} doc and decides where to send the user next.
//
// Flow:
//   no doc / not signed in   -> caller handles (ProtectedRoute upstream)
//   subscriptionActive=false -> /onboarding/payment
//   status=pending           -> /onboarding/pending
//   status=rejected          -> /onboarding/rejected
//   bgCheckConfirmed=false   -> /onboarding/background-check
//   profileComplete=false    -> /onboarding/profile
//   otherwise                -> render children (<Outlet/>)

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';
import { MEMBER_STATUS } from '../../lib/constants.js';

const ONBOARDING_PATHS = new Set([
  '/onboarding/payment',
  '/onboarding/pending',
  '/onboarding/rejected',
  '/onboarding/background-check',
  '/onboarding/profile',
]);

function decideDestination(userDoc) {
  if (!userDoc.subscriptionActive) return '/onboarding/payment';
  if (userDoc.status === MEMBER_STATUS.PENDING) return '/onboarding/pending';
  if (userDoc.status === MEMBER_STATUS.REJECTED) return '/onboarding/rejected';
  if (userDoc.status !== MEMBER_STATUS.APPROVED) return '/onboarding/pending';
  if (!userDoc.bgCheckConfirmed) return '/onboarding/background-check';
  if (!userDoc.profileComplete) return '/onboarding/profile';
  return null; // fully onboarded
}

export default function StatusGate() {
  const { userDoc, loading } = useAuth();
  const location = useLocation();

  if (loading || !userDoc) return <Spinner label="Checking your status..." />;

  const destination = decideDestination(userDoc);
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
