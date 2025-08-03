import { primaryApi } from "../http/apiClient";
import { UiToken, TokenData, mapToUiToken } from "../../types/token";
import { extractData, extractSuccess } from "../http/responseHandler";

interface PageableResponse<T> {
  list: T[];
  hasMore: boolean;
}

export const tokensService = () => {
  const searchTokens = async (query: string): Promise<UiToken[]> => {
    try {
      console.log("Sending search request:", query);
      const response = await primaryApi.get(
        `/coins/coins/search?q=${encodeURIComponent(query)}`
      );
      console.log("Search API raw response:", response.data);
      return extractData<TokenData[]>(response).map(mapToUiToken);
    } catch (error) {
      console.error("Error searching tokens:", error);
      throw error;
    }
  };

  const getPageableTokens = async (
    path: string,
    pageNo: number = 0,
    pageSize: number = 10
  ): Promise<UiToken[]> => {
    try {
      const params = new URLSearchParams({
        page: pageNo.toString(),
        size: pageSize.toString(),
      });

      const url = `${path}?${params.toString()}`;
      //console.log(`Fetching ${path} tokens:`, url);
      console.log(`🚀🚀🚀 getPageableTokens params:`, { pageNo, pageSize });
      const response = await primaryApi.get(url);
      console.log(`🚀🚀🚀 getPageableTokens response:`, response?.data?.data);
      return extractData<PageableResponse<TokenData>>(response).list.map(
        mapToUiToken
      );
    } catch (error) {
      console.error(`Error fetching ${path} tokens:`, error);
      throw error;
    }
  };

  const getRecommendedTokens = (pageNo: number = 1, pageSize: number = 10) => {
    return getPageableTokens("/coins/coins/recommend", pageNo, pageSize);
  };

  const getTrending = (pageNo: number = 1, pageSize: number = 10) => {
    return getPageableTokens("/coins/coins/trending", pageNo, pageSize);
  };

  const getWatchlist = (pageNo: number = 1, pageSize: number = 10) => {
    return getPageableTokens("/coins/watchlist", pageNo, pageSize);
  };

  const adjustWatchlistOrder = async (
    mint: string,
    nextMint?: string
  ): Promise<boolean> => {
    try {
      const response = await primaryApi.put(`/coins/watchlist/${mint}/order`, {
        nextMint,
      });
      return extractSuccess(response);
    } catch (error) {
      console.error("Error adjusting watchlist order:", error);
      return false;
    }
  };
  return {
    searchTokens,
    getWatchlist,
    getTrending,
    adjustWatchlistOrder,
    getRecommendedTokens,
  };
};

export const watchlistService = {
  async getWatchlist(
    pageNo: number = 1,
    pageSize: number = 10
  ): Promise<PageableResponse<TokenData>> {
    console.log(`🚀🚀🚀 getWatchlist params:`, { pageNo, pageSize });
    const response = await primaryApi.get(
      `/coins/watchlist?page=${pageNo}&size=${pageSize}`
    );
    console.log(`🚀🚀🚀 getWatchlist response:`, response?.data?.data);
    const rawData = response?.data?.data;
    const list = rawData?.list?.map(mapToUiToken) || [];
    return {
      ...rawData,
      list,
    };
  },
  async addToWatchlist(mint: string): Promise<boolean> {
    const response = await primaryApi.put(`/coins/watchlist/solana/${mint}`);
    return extractSuccess(response);
  },
  async removeFromWatchlist(mint: string): Promise<boolean> {
    const response = await primaryApi.delete(`/coins/watchlist/solana/${mint}`);
    return extractSuccess(response);
  },
};
