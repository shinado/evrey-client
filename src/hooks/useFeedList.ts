import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { feedsService } from '../services/__deprecated__/feeds';

// 导出 queryKey 常量供其他组件使用
export const FEED_LIST_KEYS = {
  trending: ['feeds', 'trending'],
} as const;

export function useFeedList() {
  const { getTrendingMedia } = feedsService();
  const queryClient = useQueryClient();

  const result = useInfiniteQuery({
    queryKey: FEED_LIST_KEYS.trending,
    
    queryFn: async ({ pageParam = 1 }) => {
      console.log('开始请求数据，页码:', pageParam);
      
      const result = await getTrendingMedia(pageParam.toString(), '20');
      
      // // 打印每页的详细信息，包括 tokens 的 rank
      // console.log('第', pageParam, '页数据详情:', {
      //   页码: result.pagination.page,
      //   总数: result.pagination.total,
      //   每页数量: result.pagination.pageSize,
      //   当前页数据量: result.content.length,
      //   数据ID列表: result.content.map(item => item.id)
      // });

      // // 单独打印每个 feed 的 tokens 信息
      // result.content.forEach(item => {
      //   if (item.tokens && item.tokens.length > 0) {
      //     console.log(`Feed ID ${item.id} 的 tokens:`, 
      //       item.tokens.map(token => ({
      //         symbol: token.symbol,
      //         rank: token.rank
      //       }))
      //     );
      //   }
      // });

      const hasMore = result.pagination.total > (result.pagination.page * result.pagination.pageSize);
      return {
        items: result.content,
        nextPage: hasMore ? result.pagination.page + 1 : undefined,
        hasMore
      };
    },
    
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    
    refetchOnWindowFocus: false,
    refetchInterval: false,
    initialPageParam: 1,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return result;
} 