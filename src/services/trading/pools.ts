import { CoinKlineData,TokenInfo, TIMEFRAMES, TokenData } from "../../types/token";
import { primaryApi } from "../http/apiClient";
import { extractData } from "../http/responseHandler";


export const poolsService = () => {
  const getOhlcvData = async (
    address: string,
    type: typeof TIMEFRAMES[number],
  ): Promise<CoinKlineData> => {
    try {
      const response = await primaryApi.get(`/coins/coins/k-lines/solana/${address}`, {params: { type }});

      return extractData<CoinKlineData>(response);
    } catch (error) {
      console.error(`Failed to fetch OHLCV data:`, error);
      throw error;
    }
  };
  
  const getTokenInfo = async (mint: string) => {
    try {
      const response = await primaryApi.get(`/coins/coins/detail/solana/${mint}`);
      return extractData<TokenInfo>(response);
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw error;
    }
  };

  const getShortTokenInfo = async (mint: string) => {
    try {
      const response = await primaryApi.get(`/coins/coins/short-info/solana/${mint}`);
      return extractData<TokenData>(response);
    } catch (error) {
      console.error('Error fetching short token info:', error);
      throw error;
    }
  };

  // const getPoolTrades = async (poolAddress: string, action?: 'buy' | 'sell') => {
  //   try {
  //     const actionMap = {
  //       'buy': 1,
  //       'sell': 2
  //     };

  //     const response = await api.get(
  //       `/pools/${poolAddress}/trades`,
  //       {
  //         params: action ? { action: actionMap[action] } : undefined
  //       }
  //     );
  //     return extractData<TradeResponse>(response);
  //   } catch (error) {
  //     console.error(`Failed to fetch trades for pool ${poolAddress}:`, error);
  //     return [];
  //   }
  // };

  return {
    getOhlcvData,
    getTokenInfo,
    getShortTokenInfo,
    //getPoolTrades,
  };
};
