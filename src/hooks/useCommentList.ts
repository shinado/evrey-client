import { useInfiniteQuery } from '@tanstack/react-query';
import { commentService } from '../services';
import { useIsFocused } from '@react-navigation/native';

export const COMMENT_KEYS = {
  list: (postId: string) => ['comments', 'list', postId],
  replies: (postId: string, commentId: string) => ['comments', 'replies', postId, commentId],
} as const;

/**
 * 获取评论列表的hook
 * @param postId 帖子ID
 * @param pageSize 每页数量
 */
export function useCommentList(postId: string, pageSize: string = '10') {
  const isFocused = useIsFocused();

  return useInfiniteQuery({
    queryKey: COMMENT_KEYS.list(postId),
    queryFn: async ({ pageParam }) => {
      const data = await commentService.getCommentList({
        start: pageParam || '',
        limit: pageSize,
        postId,
      });
      return {
        items: data.list,
        nextPage: data.has_more ? data.list[data.list.length - 1]?.created_at : undefined,
        hasMore: data.has_more,
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: '',
    refetchOnWindowFocus: false,
    enabled: isFocused && !!postId,
  });
}

/**
 * 获取回复列表的hook
 * @param postId 帖子ID
 * @param commentId 评论ID
 * @param pageSize 每页数量
 */
export function useReplyList(postId: string, commentId: string, pageSize: string = '10') {
  const isFocused = useIsFocused();

  return useInfiniteQuery({
    queryKey: COMMENT_KEYS.replies(postId, commentId),
    queryFn: async ({ pageParam = Date.now().toString() }) => {
      const data = await commentService.getReplyList({
        start: pageParam,
        pageSize,
        postId,
        commentId,
      });
      return {
        items: data.list,
        nextPage: data.has_more ? data.list[data.list.length - 1]?.created_at : undefined,
        hasMore: data.has_more,
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: Date.now().toString(),
    refetchOnWindowFocus: false,
    enabled: isFocused && !!postId && !!commentId,
  });
} 