import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

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
  if (!user || !allowedRoles.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (token && user?.profile_complete) return <Navigate to="/dashboard" replace />;
  if (token && !user?.profile_complete) return <Navigate to="/complete-profile" replace />;
  return <>{children}</>;
};

export const IncompleteProfileRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.profile_complete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const ProfileCompleteGuard = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.profile_complete) return <Navigate to="/complete-profile" replace />;
  return <>{children}</>;
};
