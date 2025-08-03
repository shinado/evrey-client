import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { contentService } from '../services/content/content';
import { useIsFocused } from '@react-navigation/native';
import { Post } from '../types';

export const CONTENT_LIST_KEYS = {
  list: ['content', 'list'],
  recommend: ['content', 'recommend'],
  detail: (id: string) => ['content', 'detail', id],
} as const;

export function useContentList(pageSize: string = '10') {
  return useInfiniteQuery({
    queryKey: CONTENT_LIST_KEYS.list,
    queryFn: async ({ pageParam = Date.now().toString() }) => {
      const data = await contentService.getPostList({
        start: pageParam,
        pageSize,
      });
      return {
        items: data.list,
        nextPage: data.has_more && data.next !== undefined ? String(data.next) : undefined,
        hasMore: data.has_more,
      };
    },
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: Date.now().toString(),
    refetchOnWindowFocus: false,
  });
}

export function useRecommendPostList(pageSize: string = '20') {
  return useInfiniteQuery({
    queryKey: CONTENT_LIST_KEYS.recommend,
    queryFn: async ({ pageParam = 0 }) => {
      const data = await contentService.getRecommendPostList({
        start: pageParam,
        pageSize,
      });
      return {
        items: data.list,
        nextPage: data.has_more && data.next !== undefined ? data.next : undefined,
        hasMore: data.has_more,
      };
    },
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: 0,
    refetchOnWindowFocus: false,
  });
}

export function useFeedInfo(id: string) {
  const isFocused = useIsFocused();

  return useQuery<Post | null>({
    queryKey: CONTENT_LIST_KEYS.detail(id),
    queryFn: () => contentService.getPostDetail(id),
    refetchInterval: isFocused ? 15 * 60 * 1000 : false, // 15分钟刷新一次
    enabled: isFocused && !!id,
  });
}
