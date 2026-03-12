import { useQuery } from '@tanstack/react-query';
import { academicApi } from '@/api/academic';

const unwrapPayload = (responseData: any) => responseData?.data ?? responseData;

const asSchoolYears = (payload: any) => {
  if (Array.isArray(payload?.schoolYears)) return payload.schoolYears;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const useSchoolYears = () => {
  return useQuery({
    queryKey: ['school-years'],
    queryFn: async () => {
      const response = await academicApi.getSchoolYears();
      return asSchoolYears(unwrapPayload(response.data));
    },
    staleTime: 60_000,
  });
};
