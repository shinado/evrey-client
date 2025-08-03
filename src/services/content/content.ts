import { primaryApi } from '../http/apiClient';
import { extractData, extractSuccess } from '../http/responseHandler';
import { PostType, PostStatus, TokenAttributes, Post } from '../../types';
import { mapToUiToken } from '../../types/token';

export type UploadCredentialsData = {
  bucket: string;
  credentials: Credentials;
  expiration: string;
  expiredTime: number;
  keys: string[];
  region: string;
  uris: string[];
};

export type Credentials = {
  secretId: string;
  secretKey: string;
  sessionToken: string;
};

export enum PostMediaKeys {
  IMAGES = 'images',
  VIDEOS = 'videos',
}

export interface CreatePostDto {
  title: string;
  head_img: string;
  content?: string;
  type: PostType;
  mint_chain: string;
  mint_address: string;
  media?: {
    [PostMediaKeys.IMAGES]?: string[];
    [PostMediaKeys.VIDEOS]?: string[];
  };
  status?: PostStatus;
}

export interface PostListData {
  has_more: boolean;
  list: Post[];
  next: number;
}

export interface Coin {
  attributes: TokenAttributes;
  [property: string]: any;
}

export const contentService = {
  async getUploadCred(filenames: string[]) {
    const response = await primaryApi.post('/content/posts/upload/credentials', { filenames });
    return extractData<UploadCredentialsData>(response);
  },

  async createPost(data: CreatePostDto) {
    const response = await primaryApi.post('/content/posts', data);
    return extractSuccess(response);
  },

  async getPostList(params: { start: string; pageSize: string }) {
    // console.log(`🚀🚀🚀 getPostList params:`, params);
    const response = await primaryApi.get('/content/posts', { params });
    // console.log(`🚀🚀🚀 getPostList response:`, response?.data?.data);
    const rawData = response.data.data;
    return {
      ...rawData,
      list: rawData.list.map((post: any) => ({
        ...post,
        coin: post.coin ? mapToUiToken(post.coin) : null,
      })),
    };
  },

  async getRecommendPostList(params: { start: number; pageSize: string }) {
    console.log(`🚀🚀🚀 getRecommendPostList params:`, params);
    const response = await primaryApi.get('/content/recommendations', { params });
    console.log(`🚀🚀🚀 getRecommendPostList response:`, JSON.stringify(response?.data?.data));
    const rawData = response.data.data;
    return {
      ...rawData,
      list: rawData.list.map((post: any) => ({
        ...post,
        coin: post.coin ? mapToUiToken(post.coin) : null,
      })),
    };
  },

  async getPostDetail(id: string) {
    try {
      const response = await primaryApi.get(`/content/posts/${id}`);
      const post = response.data.data;
      post.coin = mapToUiToken(post.coin);
      return post;
    } catch (error) {
      console.log('Fail to get post detail', id, error);
      return null;
    }
  },

  async getFollowedPosts(start: number | undefined, limit: number) {
    const params: { limit: number; start?: number } = { limit };
    if (start !== undefined) {
      params.start = start;
    }
    // console.log(`🚀🚀🚀 getFollowedPosts params:`, params);
    const response = await primaryApi.get(`/content/follow/feeds`, {
      params: params,
    });
    // console.log(`🚀🚀🚀 getFollowedPosts response:`, response?.data?.data);
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
};

export const followService = {
  async follow(followingId: string) {
    const response = await primaryApi.put(`/content/follow/user/${followingId}`);
    return extractSuccess(response);
  },
  async unfollow(followingId: string) {
    const response = await primaryApi.delete(`/content/follow/user/${followingId}`);
    return extractSuccess(response);
  },
};
