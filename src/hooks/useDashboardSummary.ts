import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';

const unwrapPayload = <T = any>(responseData: any): T => (responseData?.data ?? responseData) as T;

export const useAdminDashboardSummary = (schoolYearId?: string) => {
  return useQuery({
    queryKey: ['admin-dashboard-summary', schoolYearId],
    queryFn: async () => {
      if (!schoolYearId) return null;
      const response = await analyticsApi.getAdminDashboardSummary(schoolYearId);
      return unwrapPayload(response.data);
    },
    enabled: Boolean(schoolYearId),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
};

export const useTeacherDashboardSummary = (schoolYearId?: string) => {
  return useQuery({
    queryKey: ['teacher-dashboard-summary', schoolYearId],
    queryFn: async () => {
      if (!schoolYearId) return null;
      const response = await analyticsApi.getTeacherDashboardSummary(schoolYearId);
      return unwrapPayload(response.data);
    },
    enabled: Boolean(schoolYearId),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
};
