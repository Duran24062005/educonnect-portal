import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/auth';
import {
  PublicOnlyRoute,
  IncompleteProfileRoute,
  ProfileCompleteGuard,
  RoleRoute,
  AccountStatusRoute,
} from '@/routes/guards';

import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import AccountStatusPage from './pages/AccountStatusPage';
import UsersPage from './pages/users/UsersPage';
import PendingUsersPage from './pages/users/PendingUsersPage';
import SchoolYearsPage from './pages/academic/SchoolYearsPage';
import PeriodsPage from './pages/academic/PeriodsPage';
import { GradesPage, AreasPage } from './pages/academic/CrudPages';
import GroupsPage from './pages/groups/GroupsPage';
import EnrollmentsPage from './pages/admin/EnrollmentsPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import AulasManagementPage from './pages/admin/AulasManagementPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from "./pages/NotFound";

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const GroupDetailPage = lazy(() => import('./pages/groups/GroupDetailPage'));
const MyGroupsPage = lazy(() => import('./pages/teacher/MyGroupsPage'));
const GroupGradeItemsPage = lazy(() => import('./pages/teacher/GroupGradeItemsPage'));
const GroupScoresPage = lazy(() => import('./pages/teacher/GroupScoresPage'));
const PeriodResultsPage = lazy(() => import('./pages/teacher/PeriodResultsPage'));
const TeacherActivitiesPage = lazy(() => import('./pages/teacher/TeacherActivitiesPage'));
const MyActivitiesPage = lazy(() => import('./pages/student/MyActivitiesPage'));
const MyGradesPage = lazy(() => import('./pages/student/MyGradesPage'));
const MyResultsPage = lazy(() => import('./pages/student/MyResultsPage'));
const StudentActivityDetailPage = lazy(() => import('./pages/student/StudentActivityDetailPage'));
const EvaluationStatsPage = lazy(() => import('./pages/EvaluationStatsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInitializer>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/complete-profile" element={<IncompleteProfileRoute><CompleteProfilePage /></IncompleteProfileRoute>} />
              <Route path="/account-status" element={<AccountStatusRoute><AccountStatusPage /></AccountStatusRoute>} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProfileCompleteGuard><DashboardPage /></ProfileCompleteGuard>} />
              <Route path="/profile" element={<ProfileCompleteGuard><ProfilePage /></ProfileCompleteGuard>} />
              <Route path="/notifications" element={<ProfileCompleteGuard><NotificationsPage /></ProfileCompleteGuard>} />

              {/* Admin routes */}
              <Route path="/users" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><UsersPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/users/pending" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><PendingUsersPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/academic/school-years" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><SchoolYearsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/academic/periods" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><PeriodsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/academic/grades" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><GradesPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/academic/areas" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><AreasPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/academic/aulas" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><AulasManagementPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/academic/promotions" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><PromotionsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/groups" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><GroupsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/groups/:id" element={<ProfileCompleteGuard><GroupDetailPage /></ProfileCompleteGuard>} />
              <Route path="/groups/enrollments" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><EnrollmentsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/evaluations/stats" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><EvaluationStatsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/evaluations/stats/:school_year_id" element={<ProfileCompleteGuard><RoleRoute roles={['admin']}><EvaluationStatsPage /></RoleRoute></ProfileCompleteGuard>} />

              {/* Teacher routes */}
              <Route path="/my-groups" element={<ProfileCompleteGuard><RoleRoute roles={['teacher']}><MyGroupsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/teacher/activities/:groupId/:areaId" element={<ProfileCompleteGuard><RoleRoute roles={['teacher']}><TeacherActivitiesPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/groups/:id/grade-items" element={<ProfileCompleteGuard><RoleRoute roles={['teacher']}><GroupGradeItemsPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/groups/:id/scores" element={<ProfileCompleteGuard><RoleRoute roles={['teacher']}><GroupScoresPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/period-results" element={<ProfileCompleteGuard><RoleRoute roles={['teacher']}><PeriodResultsPage /></RoleRoute></ProfileCompleteGuard>} />

              {/* Student routes */}
              <Route path="/my-activities" element={<ProfileCompleteGuard><RoleRoute roles={['student']}><MyActivitiesPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/my-activities/:activityId" element={<ProfileCompleteGuard><RoleRoute roles={['student']}><StudentActivityDetailPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/my-grades" element={<ProfileCompleteGuard><RoleRoute roles={['student']}><MyGradesPage /></RoleRoute></ProfileCompleteGuard>} />
              <Route path="/my-results" element={<ProfileCompleteGuard><RoleRoute roles={['student']}><MyResultsPage /></RoleRoute></ProfileCompleteGuard>} />

              {/* Redirects */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
