import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isSignedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[--color-page-bg] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[--color-accent-cyan] animate-spin" />
        <span className="text-xs font-semibold text-[--color-text-secondary] tracking-wide">
          Verifying security credentials...
        </span>
      </div>
    );
  }

  if (!isSignedIn) {
    // Redirect to Clerk sign-in, saving the attempted location for subsequent return
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

