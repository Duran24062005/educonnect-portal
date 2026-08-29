import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getLandingRoute, isBlockedAccountStatus } from '@/lib/auth';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return null;
  const userRole = (user?.role || '').toLowerCase();
  const allowedRoles = roles.map((role) => role.toLowerCase());
  if (!user || !allowedRoles.includes(userRole)) return <Navigate to={getLandingRoute(user?.role)} replace />;
  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (token && isBlockedAccountStatus(user?.status)) return <Navigate to="/account-status" replace />;
  if (token && user?.profile_complete) return <Navigate to={getLandingRoute(user?.role)} replace />;
  if (token && !user?.profile_complete) return <Navigate to="/complete-profile" replace />;
  return <>{children}</>;
};

export const IncompleteProfileRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (isBlockedAccountStatus(user?.status)) return <Navigate to="/account-status" replace />;
  if (user?.profile_complete) return <Navigate to={getLandingRoute(user?.role)} replace />;
  return <>{children}</>;
};

export const ProfileCompleteGuard = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  const location = useLocation();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.profile_complete) return <Navigate to="/complete-profile" replace />;
  if (isBlockedAccountStatus(user?.status)) return <Navigate to="/account-status" replace />;
  if (user?.role?.toLowerCase() === 'superadmin' && !location.pathname.startsWith('/platform')) {
    return <Navigate to="/platform/institutions" replace />;
  }
  return <>{children}</>;
};

export const AccountStatusRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!token && !sessionStorage.getItem('account-state')) return <Navigate to="/login" replace />;
  if (token && user?.profile_complete && !isBlockedAccountStatus(user?.status)) {
    return <Navigate to={getLandingRoute(user?.role)} replace />;
  }
  return <>{children}</>;
};
