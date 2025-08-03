import { primaryApi } from './http/apiClient';
import { mapToUiToken, Post } from 'src/types';

export interface PostSearchResult {
  has_more: boolean;
  list: Post[];
}

export const postService = {
  searchPosts: async (q: string, page: number, pageSize: number) => {
    const response = await primaryApi.get(`/content/posts/search`, {
      params: {
        q,
        page,
        page_size: pageSize,
      },
    });
    const rawData = response?.data?.data;
    const list = rawData?.list?.map((post: any) => ({
      ...post,
      coin: mapToUiToken(post.coin),
    }));
    return {
      ...rawData,
      list,
    };
  },

  getMyPosts: async (page: number, pageSize: number) => {
    // console.log(`🚀🚀🚀 getMyPosts params:`, { page, pageSize });
    const response = await primaryApi.get(`/content/posts/my`, {
      params: {
        page,
        page_size: pageSize,
      },
    });
    // console.log(`🚀🚀🚀 getMyPosts response:`, response?.data?.data);
    const rawData = response?.data?.data;
    const list = rawData?.list?.map((post: any) => ({
      ...post,
      coin: mapToUiToken(post.coin),
    }));
    return {
      ...rawData,
      list,
    };
  },

  // by-user-interests
  fetchMyInterestedPosts: async (limit: number) => {
    // console.log(`🚀🚀🚀 fetchMyInterestedPosts params:`, { limit });
    const response = await primaryApi.get(`/content/posts/by-user-interests`, {
      params: {
        limit,
      },
    });
    // console.log(`🚀🚀🚀 fetchMyInterestedPosts response:`, JSON.stringify(response.data.data));
    const rawData = response?.data?.data?.data;
    const list = rawData?.posts?.map((post: any) => ({
      ...post,
      coin: mapToUiToken(post.coin),
    }));
    return {
      ...rawData,
      list,
    };
  },

  fetchUserPosts: async (userId: string, page: number, pageSize: number) => {
    // console.log(`🚀🚀🚀 getUserPosts params:`, { userId, page, pageSize });
    const response = await primaryApi.get(`/content/posts/by-author/${userId}`, {
      params: {
        page,
        pageSize,
      },
    });
    // console.log(`🚀🚀🚀 getUserPosts response:`, response?.data?.data);
    const rawData = response?.data?.data;
    const list = rawData?.list?.map((post: any) => ({
      ...post,
      coin: mapToUiToken(post.coin),
    }));
    return {
      ...rawData,
      list,
    };
  },

  getPostTradeHistory: async (postId: string, start: number) => {
    // console.log(`🚀🚀🚀 getPostTradeHistory params:`, { postId, start });
    const response = await primaryApi.get(`/content-trade/history/by-post/${postId}`, {
      params: {
        start,
        limit: 20,
      },
    });
    // console.log(`🚀🚀🚀 getPostTradeHistory response:`, JSON.stringify(response));
    return response?.data?.data;
  },
};
