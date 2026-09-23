import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[--color-bg-base] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[--color-accent-cyan] animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if unauthenticated, saving the attempted path
    // Wait, since we don't have a login page yet, we can redirect to home /
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
