import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi, type CreateGroupPayload } from '@/api/groups';
import { academicApi } from '@/api/academic';
import { asArray, unwrapPayload } from './utils';

export const useAdminSchoolYears = () => {
  return useQuery({
    queryKey: ['admin', 'school-years'],
    queryFn: async () => {
      const res = await academicApi.getSchoolYears();
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['schoolYears']);
    },
    staleTime: 60_000,
  });
};

export const useAdminGrades = () => {
  return useQuery({
    queryKey: ['admin', 'grades'],
    queryFn: async () => {
      const res = await academicApi.getGrades();
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['grades']);
    },
    staleTime: 60_000,
  });
};

export const useAdminGroupsByYear = (schoolYearId?: string) => {
  return useQuery({
    queryKey: ['admin', 'groups', schoolYearId],
    queryFn: async () => {
      if (!schoolYearId) return [];
      const res = await groupsApi.getBySchoolYear(schoolYearId);
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['groups']);
    },
    enabled: Boolean(schoolYearId),
    staleTime: 30_000,
  });
};

export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupsApi.create(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', 'groups', variables.school_year_id] });
    },
  });
};
