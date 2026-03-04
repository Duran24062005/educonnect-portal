import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicApi, type CreateAulaPayload } from '@/api/academic';
import { asArray, unwrapPayload } from './utils';

export const useAdminAulas = () => {
  return useQuery({
    queryKey: ['admin', 'aulas'],
    queryFn: async () => {
      const res = await academicApi.getAulas();
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['aulas']);
    },
    staleTime: 60_000,
  });
};

export const useCreateAula = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAulaPayload) => academicApi.createAula(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'aulas'] }),
  });
};
