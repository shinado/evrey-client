import { useInfiniteQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { fetchCommissionHistory } from '../services/trading/history';

export const COMMISSION_HISTORY_KEYS = {
  list: () => ['commissionHistory'],
} as const;

/**
 * 获取佣金历史记录的hook
 * @param enabled 是否启用查询，默认为true
 * @param limit 每页数据量，默认为10
 */
export function useCommissionHistory(enabled: boolean = true, limit: number = 10) {
  const isFocused = useIsFocused();

  return useInfiniteQuery({
    queryKey: COMMISSION_HISTORY_KEYS.list(),
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🚀 useCommissionHistory fetching:', {
        start: pageParam,
        limit,
      });
      const response = await fetchCommissionHistory(pageParam, limit);

      return {
        items: response.list,
        nextPage: response.has_more ? response.next : undefined,
        hasMore: response.has_more,
      };
    },
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    enabled: isFocused && enabled,
    staleTime: 60 * 1000, // 1分钟内数据保持新鲜
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收时间
  });
}
