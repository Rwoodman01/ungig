import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';

export default function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Spinner label="Checking admin access..." />;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
