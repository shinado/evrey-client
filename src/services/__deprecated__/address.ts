import { aiboxApi ,primaryApi } from "../api/api"; // 确保你的 `api` 请求封装已正确导入

/** 地址白名单请求结构 */
export interface AddressWhitelistRequest {
  addresses: Address[];
  /** 谷歌验证码 */
  googleCode?: string;
  /** 验证码 */
  verificationCode: string;
  [property: string]: any;
}

/** 地址数据结构 */
export interface Address {
  coinId: number;
  coinRelationId: number;
  /** 币类型，0 USDT */
  coinType: number;
  /** 名称 */
  name: string;
  /** 钱包地址 */
  walletAddress: string;
  /** 钱包网络，0 trx */
  // walletProvider: number;
  [property: string]: any;
}

/** API 响应结构 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  msgId: string;
  ts: number;
  [property: string]: any;
}

/**
 * `coin-infos` 接口返回的通用响应格式
 */
export interface CoinInfosResponse {
  /**
   * 0 成功，非 0 失败
   */
  code: number;
  /**
   * 业务数据
   */
  data: CoinInfosData;
  /**
   * 消息描述
   */
  message: string;
  /**
   * 消息标识 ID
   */
  msgId: string;
  /**
   * 当前时间戳
   */
  ts: number;
  [property: string]: any;
}

/**
 * `coin-infos` 接口返回的数据
 */
export interface CoinInfosData {
  /**
   * 是否有更多数据
   */
  hasMore: boolean;
  /**
   * 币种列表
   */
  list: CoinInfosList[];
  /**
   * 总条数
   */
  total: number;
  [property: string]: any;
}

/**
 * 币种信息
 */
export interface CoinInfosList {
  /**
   * 币种图标 URL
   */
  coinIconUrl: string;
  /**
   * 默认的链 ID
   */
  defaultChainId: number;
  /**
   * 币种 ID
   */
  id: number;
  /**
   * 币种名称
   */
  name: string;
  /**
   * 币种 Symbol
   */
  symbol: string;
  [property: string]: any;
}

/**
 * `coin-infos/{id}/chains` 请求参数
 */
export interface CoinChainsRequest {
  /**
   * 币种 ID
   */
  id: number;
  [property: string]: any;
}

/**
 * `coin-infos/{id}/chains` 接口响应结构
 */
export interface CoinChainsResponse {
  /**
   * 0 成功，非 0 失败
   */
  code: number;
  /**
   * 业务数据
   */
  data: CoinChainsData;
  /**
   * 消息描述
   */
  message: string;
  /**
   * 消息标识 ID
   */
  msgId: string;
  /**
   * 当前时间戳
   */
  ts: number;
  [property: string]: any;
}

/**
 * `coin-infos/{id}/chains` 接口返回的业务数据
 */
export interface CoinChainsData {
  /**
   * 是否有更多数据
   */
  hasMore: boolean;
  /**
   * 支持的链列表
   */
  list: CoinChainsList[];
  /**
   * 总条数
   */
  total: number;
  [property: string]: any;
}

/**
 * 支持的链信息
 */
export interface CoinChainsList {
  /**
   * 链图标 URL
   */
  chainIconUrl: string;
  /**
   * 链名称
   */
  chainName: string;
  /**
   * 链 ID
   */
  id: number;
  [property: string]: any;
}


export const addressService = {
  /** 添加地址白名单 */
  addAddressWhitelist: async (requestData: AddressWhitelistRequest): Promise<ApiResponse<boolean>> => {
    try {
      const response = await aiboxApi.post<ApiResponse<boolean>>(
        "/assets-service/address-whitelist",
        requestData,
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message);
      }

      return response.data; // 直接返回完整的 API 响应结构
    } catch (error) {
      console.error("❌ 添加地址白名单失败:", error);
      throw error;
    }
  },
  /** 获取支持充值的币种列表 */
  getCoinInfos: async (): Promise<CoinInfosResponse> => {
    try {
      const response = await primaryApi.get<CoinInfosResponse>("/assets-service/coin-infos");

      if (response.data.code !== 0) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching coin infos:", error);
      throw error;
    }
  },
  /** 通过币种 ID 获取支持的链 */
  getChainsByCoinId: async (coinId: number): Promise<CoinChainsResponse> => {
    try {
      const response = await primaryApi.get<CoinChainsResponse>(`/assets-service/coin-infos/${coinId}/chains`);

      if (response.data.code !== 0) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching chains for coin ID ${coinId}:`, error);
      throw error;
    }
  },
};