import { useQuery } from '@tanstack/react-query';
import { tokensService } from '../services/trading/tokens';
import { UiToken } from '../types/token';
import { queryClient } from '../services';

// 限制搜索查询的最大数量
const MAX_SEARCH_QUERIES = 20;

export function useSearchTokens(query: string) {
  // 检查当前缓存的搜索查询数量
  const searchQueries = queryClient.getQueriesData({ 
    queryKey: ['searchTokens'] 
  });
  
  // 如果超过最大数量，移除最旧的查询
  if (searchQueries.length > MAX_SEARCH_QUERIES) {
    // 按时间排序，获取最旧的查询
    const oldestQueries = [...searchQueries]
      .sort((a, b) => {
        const queryA = queryClient.getQueryState(a[0]);
        const queryB = queryClient.getQueryState(b[0]);
        return (queryA?.dataUpdatedAt || 0) - (queryB?.dataUpdatedAt || 0);
      })
      .slice(0, searchQueries.length - MAX_SEARCH_QUERIES);
    
    // 移除最旧的查询
    oldestQueries.forEach(query => {
      queryClient.removeQueries({ queryKey: query[0] });
    });
  }

  return useQuery<UiToken[]>({
    queryKey: ['searchTokens', query],
    queryFn: async () => {
      if (!query.trim()) {
        return [];
      }
      
      try {
        // 直接从API获取搜索结果
        const tokens = await tokensService().searchTokens(query);
        return tokens;
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    enabled: query.trim().length > 0,
  });
} 