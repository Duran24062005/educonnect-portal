import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '@/api/groups';

const unwrapPayload = <T = any>(responseData: any): T => (responseData?.data ?? responseData) as T;

export const useGroupDetailSummary = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-detail-summary', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const response = await groupsApi.getDetailSummary(groupId);
      return unwrapPayload(response.data);
    },
    enabled: Boolean(groupId),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
};
