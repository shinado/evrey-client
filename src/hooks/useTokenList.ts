import { useInfiniteQuery } from '@tanstack/react-query';
import { tokensService } from '../services/trading/tokens';
import { useIsFocused } from '@react-navigation/native';

type TokenListType = 'recommended' | 'trending' | 'watchlist';

// 导出 queryKey 常量供其他组件使用
export const TOKEN_LIST_KEYS = {
  recommended: ['tokens', 'recommended'],
  trending: ['tokens', 'trending'],
  watchlist: ['tokens', 'watchlist'],
} as const;

export function useTokenList(type: TokenListType) {
  const isFocused = useIsFocused(); // 获取当前页面是否处于焦点状态

  // 根据类型获取对应的加载函数
  const getTokensFn = () => {
    switch (type) {
      case 'recommended':
        return tokensService().getRecommendedTokens;
      case 'trending':
        return tokensService().getTrending;
      case 'watchlist':
        return tokensService().getWatchlist;
    }
  };

  return useInfiniteQuery({
    // 使用常量作为 queryKey
    queryKey: TOKEN_LIST_KEYS[type],
    
    // 获取数据的函数
    queryFn: ({ pageParam = 1 }) => getTokensFn()(pageParam + 1),
    
    // 下一页判断
    getNextPageParam: (lastPage, allPages) => lastPage.length === 10 ? allPages.length : undefined,
    initialPageParam: 0,
    
    // 只在页面聚焦时启用自动刷新
    refetchInterval: isFocused && type !== 'watchlist' ? 60 * 1000 : false,
    enabled: isFocused, // 只在页面聚焦时启用查询
  });
} 