import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicApi, type RunPromotionPayload } from '@/api/academic';
import { asArray, unwrapPayload } from './utils';

export const usePromotionSchoolYears = () => {
  return useQuery({
    queryKey: ['admin', 'promotion', 'school-years'],
    queryFn: async () => {
      const res = await academicApi.getSchoolYears();
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['schoolYears']);
    },
  });
};

export const useRunPromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RunPromotionPayload) => academicApi.runPromotions(payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'users', 'all'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'groups'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'students'] }),
      ]);
    },
  });
};
