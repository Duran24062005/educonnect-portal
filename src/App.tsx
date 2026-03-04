import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/auth';
import { PublicOnlyRoute, IncompleteProfileRoute, ProfileCompleteGuard, RoleRoute } from '@/routes/guards';

import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import PendingUsersPage from './pages/users/PendingUsersPage';
import SchoolYearsPage from './pages/academic/SchoolYearsPage';
import PeriodsPage from './pages/academic/PeriodsPage';
import { GradesPage, AreasPage, AulasPage } from './pages/academic/CrudPages';
import GroupsPage from './pages/groups/GroupsPage';
import GroupDetailPage from './pages/groups/GroupDetailPage';
import MyGroupsPage from './pages/teacher/MyGroupsPage';
import GroupGradeItemsPage from './pages/teacher/GroupGradeItemsPage';
import GroupScoresPage from './pages/teacher/GroupScoresPage';
import PeriodResultsPage from './pages/teacher/PeriodResultsPage';
import MyGradesPage from './pages/student/MyGradesPage';
import MyResultsPage from './pages/student/MyResultsPage';
import ProfilePage from './pages/ProfilePage';
import EvaluationStatsPage from './pages/EvaluationStatsPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/complete-profile" element={<IncompleteProfileRoute><CompleteProfilePage /></IncompleteProfileRoute>} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProfileCompleteGuard><DashboardPage /></ProfileCompleteGuard>} />
            <Route path="/profile" element={<ProfileCompleteGuard><ProfilePage /></ProfileCompleteGuard>} />

            {/* Admin routes */}
            <Route path="/users" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><UsersPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/users/pending" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><PendingUsersPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/academic/school-years" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><SchoolYearsPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/academic/periods" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><PeriodsPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/academic/grades" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><GradesPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/academic/areas" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><AreasPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/academic/aulas" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><AulasPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/groups" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><GroupsPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/groups/:id" element={<ProfileCompleteGuard><GroupDetailPage /></ProfileCompleteGuard>} />
            <Route path="/evaluations/stats" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><EvaluationStatsPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/evaluations/stats/:school_year_id" element={<ProfileCompleteGuard><RoleRoute roles={['Admin']}><EvaluationStatsPage /></RoleRoute></ProfileCompleteGuard>} />

            {/* Teacher routes */}
            <Route path="/my-groups" element={<ProfileCompleteGuard><RoleRoute roles={['Teacher']}><MyGroupsPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/groups/:id/grade-items" element={<ProfileCompleteGuard><RoleRoute roles={['Teacher']}><GroupGradeItemsPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/groups/:id/scores" element={<ProfileCompleteGuard><RoleRoute roles={['Teacher']}><GroupScoresPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/period-results" element={<ProfileCompleteGuard><RoleRoute roles={['Teacher']}><PeriodResultsPage /></RoleRoute></ProfileCompleteGuard>} />

            {/* Student routes */}
            <Route path="/my-grades" element={<ProfileCompleteGuard><RoleRoute roles={['Student']}><MyGradesPage /></RoleRoute></ProfileCompleteGuard>} />
            <Route path="/my-results" element={<ProfileCompleteGuard><RoleRoute roles={['Student']}><MyResultsPage /></RoleRoute></ProfileCompleteGuard>} />

            {/* Redirects */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
