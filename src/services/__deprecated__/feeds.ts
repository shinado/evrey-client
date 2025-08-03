import { socialMediaApi } from '../http/apiClient';
import { UiToken } from '../../types/token';

// 定义媒体类型
export interface MediaItem {
  url: string;
  type: string;
  previewImageUrl?: string;
}

// 定义社交媒体项目类型
export interface SocialMedia {
  id: number;
  title: string;
  description?: string;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorUserName: string | null;
  authorProfilePicture: string | null;
  tokens: UiToken[];
}


// 定义代币市场数据类型
export interface TokenMarketData {
    price: number,
    updateUnixTime: number,
    updateHumanTime: string,
    volumeUSD: number,
    volumeChangePercent: number,
    priceChangePercent: number
}

/**
 * 提取社交媒体 API 响应数据
 * @param response Axios 响应对象
 * @returns 提取的数据
 * @throws 如果响应状态不是 success
 */
function extractSocialData<T>(response: { 
  data: { 
    status: string; 
    data: T;
  }; 
}): T {
  if (response.data.status !== 'success') {
    throw new Error(`API Error: ${response.data.status}`);
  }
  return response.data.data;
}

export const feedsService = () => {
  /**
   * 查询媒体相关的代币
   * @param mediaId 媒体ID
   * @returns 相关代币列表
   */
  const getMediaRelatedTokens = async (
    mediaId: number
  ): Promise<UiToken[]> => {
    try {
      const url = `/api/social-media/${mediaId}/tokens`;
      console.log('Fetching media related tokens:', url);
      const response = await socialMediaApi.get(url);
      const result = extractSocialData<{ tokens: UiToken[] }>(response);
      console.log("tokens", result.tokens);
      return result.tokens;
    } catch (error) {
      console.error('Error fetching media related tokens:', error);
      throw error;
    }
  };

  /**
   * 获取代币的市场信息
   * @param addresses 代币地址列表
   * @returns 代币市场数据映射
   */
  const getTokenMarketData = async (
    addresses: string[]
  ): Promise<Record<string, TokenMarketData>> => {
    try {
      if (!addresses.length) {
        return {};
      }

      const url = `/api/tokens/market-data?addresses=${addresses.join(',')}`;
      console.log('Fetching token market data:', url);
      
      const response = await socialMediaApi.get(url);
      console.log('token market data', response.data);
      return extractSocialData<Record<string, TokenMarketData>>(response);
    } catch (error) {
      console.error('Error fetching token market data:', error);
      throw error;
    }
  };

  /**
   * 获取 trending-media 信息流
   * @param page 页码（字符串）
   * @param pageSize 每页数量（字符串）
   * @returns 社交媒体列表和分页信息，每个媒体自带 tokens
   */
  const getTrendingMedia = async (
    page: string = '1',
    pageSize: string = '20'
  ): Promise<{
    content: SocialMedia[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
    };
  }> => {
    try {
      const params = new URLSearchParams({
        page,
        pageSize
      });
      const url = `/api/social-media/list?${params.toString()}`;
      console.log('Fetching trending media:', url);

      const response = await socialMediaApi.get(url);
      if (!response.data.success) {
        throw new Error('API Error: ' + response.data.success);
      }
      const { list, pagination } = response.data.data;
      return {
        content: list,
        pagination
      };
    } catch (error) {
      console.error('Error fetching trending media:', error);
      throw error;
    }
  };

  return {
    getTrendingMedia,
    getMediaRelatedTokens,
    getTokenMarketData
  };
};
