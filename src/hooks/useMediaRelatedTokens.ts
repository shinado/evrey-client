import { useQuery } from '@tanstack/react-query';
import { feedsService, TokenMarketData } from '../services/__deprecated__/feeds';
import { useIsFocused } from '@react-navigation/native';

// 定义查询键常量
export const MEDIA_TOKENS_KEYS = {
  //detail: (mediaId: number) => ['media', mediaId, 'tokens'],
  marketData: (addresses: string[]) => ['tokens', 'market-data', addresses],
} as const;

// /**
//  * 获取与媒体相关的代币信息
//  * @param mediaId 媒体ID
//  */
// export function useMediaRelatedTokens(mediaId: number) {
//   const { getMediaRelatedTokens } = feedsService();
  
//   return useQuery({
//     queryKey: MEDIA_TOKENS_KEYS.detail(mediaId),
//     queryFn: async () => {
//       try {
//         const result = await getMediaRelatedTokens(mediaId);
//         return result;
//       } catch (error) {
//         console.error('获取媒体相关代币失败:', error);
//         throw error;
//       }
//     },
//     enabled: !!mediaId, // 只有当 mediaId 存在时才启用查询
//   });
// }

/**
 * 获取代币的市场数据
 * @param addresses 代币地址列表
 */
export function useTokenMarketData(addresses: string[]) {
  const { getTokenMarketData } = feedsService();
  const isFocused = useIsFocused();

  return useQuery({
    queryKey: MEDIA_TOKENS_KEYS.marketData(addresses),
    queryFn: async () => {
      try {
        const result = await getTokenMarketData(addresses);
        console.log('token market data', result);
        return result;
      } catch (error) {
        console.error('获取代币市场数据失败:', error);
        throw error;
      }
    },
    enabled: isFocused && addresses.length > 0, // 只有当页面聚焦且有代币地址时才启用查询
    refetchInterval: isFocused ? 60 * 1000 : false, // 页面聚焦时每分钟更新一次
  });
} 