import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';

// Gates any route that needs an authenticated Firebase user.
// Unknown users are bounced to /signin with a redirect hint.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Loading your account..." />;
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
