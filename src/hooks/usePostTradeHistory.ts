import { useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "../services/post";
import { useIsFocused } from "@react-navigation/native";

export const POST_HISTORY_KEYS = {
  list: (postId: string) => ["post", "history", postId],
} as const;

/**
 * 获取帖子历史记录的hook
 * @param postId 帖子ID
 * @param enabled 是否启用查询，默认为true
 */
export function usePostTradeHistory(postId: string, enabled: boolean = true) {
  const isFocused = useIsFocused();

  return useInfiniteQuery({
    queryKey: POST_HISTORY_KEYS.list(postId),
    queryFn: async ({ pageParam = 0 }) => {
      const data = await postService.getPostTradeHistory(postId, pageParam);

      // 兼容不同的返回数据结构
      const list = data.list || data || [];
      const hasMore = data.has_more ?? data.hasMore ?? false;

      return {
        items: list,
        nextPage:
          hasMore && list.length > 0
            ? list[list.length - 1]?.created_at
            : undefined,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    enabled: isFocused && !!postId && enabled,
    staleTime: 60 * 1000, // 1分钟内数据保持新鲜
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收时间
  });
}
