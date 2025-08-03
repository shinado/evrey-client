import { QueryClient } from '@tanstack/react-query';
import { Post } from '../types/content';

/**
 * 最简单的缓存更新方式
 * 直接使用 React Query 的内置方法
 */

/**
 * 更新单个查询缓存
 */
export const updateCache = <T>(
  queryClient: QueryClient,
  queryKey: string[],
  updater: (oldData: T) => T
) => {
  queryClient.setQueryData(queryKey, updater);
};

/**
 * 更新多个查询缓存
 */
export const updateCaches = <T>(
  queryClient: QueryClient,
  queryKey: string[],
  updater: (oldData: T) => T
) => {
  queryClient.setQueriesData({ queryKey }, updater);
};

/**
 * 更新列表中的某个项目
 */
export const updateListItem = <T>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
  updater: (item: T) => T,
  idField: keyof T = 'id' as keyof T
) => {
  queryClient.setQueriesData(
    { queryKey },
    (oldData: any) => {
      if (!oldData?.pages) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: T) => 
            item[idField] === itemId ? updater(item) : item
          )
        }))
      };
    }
  );
};

/**
 * 帖子点赞专用函数（最常用）
 */
export const updatePostLike = (
  queryClient: QueryClient,
  postId: string,
  isLiked: boolean,
  likeCount: number
) => {
  // 更新列表中的帖子
  updateListItem(
    queryClient,
    ['content', 'list'],
    postId,
    (post: Post) => ({ ...post, isFavorited: isLiked, favoritesCount: likeCount })
  );

  // 更新详情页面
  updateCache(
    queryClient,
    ['content', 'detail', postId],
    (post: Post) => ({ ...post, isFavorited: isLiked, favoritesCount: likeCount })
  );
};
