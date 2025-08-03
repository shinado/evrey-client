import { FetchCommissionHistoryResponse } from "src/types/history";
import { primaryApi } from "../http/apiClient";
import { extractData } from "../http/responseHandler";

export interface Transaction {
  id: number;
  user_id: number;
  type: number;
  amountUsdt: string;
  amountToken: string;
  slippageBps: string;
  tradingFee: string;
  platformFee: string;
  referrerFee: string;
  referrers: number;
  extraData?: {
    [key: string]: any;
  };
  txHash?: string;
  status: number;
  commissionStatus: number;
  commissionHash?: string;
  commissionAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 链上充值记录接口 Request */
export interface DepositRequest {
  start?: number;
  pageSize: number;
}

/** 充值记录数据 */
export interface DepositData {
  list: DepositList[];
  hasMore: boolean;
  next: number;
}

/** 充值记录 List */
export interface DepositList {
  amount_token?: string;
  coin_image_url?: string;
  coin_symbol?: string;
  created_at?: string;
  decimal?: number;
  from_address?: string;
  id?: number;
  latest_index?: number;
  mint?: string;
  signature?: string;
  timestamp?: number;
  to_address?: string;
  type?: number;
  updated_at?: string;
}

export interface TradeRequest {
  pageSize?: number; // 每页数据量
  start?: number; // 起始值（分页）
  type?: number[] | number; // 交易类型筛选
  [property: string]: any;
}

export interface TradeData {
  hasMore: boolean; // 是否有更多数据
  list: Transaction[]; // 交易记录列表
  next: number; // 下一页起始值
}

export interface HistoryReportData {
  commissionAmount: string;
  tradeCount: string;
}

/** 获取链上充值记录 */
export const getDepositHistory = async (params: DepositRequest) => {
  try {
    if (!params.start) {
      delete params.start;
    }
    console.log("🚀🚀🚀getDepositHistory", params);
    const response = await primaryApi.get("/coins/trade-view/deposit-history", {
      params,
    });
    console.log("🚀🚀🚀getDepositHistory response", response);
    return extractData<DepositData>(response);
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    throw error;
  }
};
/** 获取空投记录 */
export const getAirdropHistory = async (params: {
  pageNo: number;
  pageSize: number;
}) => {
  try {
    const response = await primaryApi.get("/coins/trade-view/airdrop-history", {
      params,
    });

    return extractData<DepositData>(response);
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    throw error;
  }
};

const buildQueryParams = (params: Record<string, any>): string => {
  const queryParams = Object.entries(params)
    .flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map(
            (val) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
          ) // 处理数组
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return queryParams;
};

/**获取交易记录**/
export const getTradeHistory = async (params: TradeRequest) => {
  const query = buildQueryParams(params);
  try {
    const response = await primaryApi.get("/coins/trade?" + query);

    return extractData<TradeData>(response);
  } catch (error) {
    console.error("Error fetching trade history:", error);
    return { hasMore: false, list: [], next: 0 }; // 发生错误时返回空数据，避免崩溃
  }
};

export const fetchCommissionHistory = async (
  start: number,
  limit: number = 20
) => {
  console.log("🚀🚀🚀 fetchCommissionHistory params:", start, limit);
  const response = await primaryApi.get("/content-trade/history/by-author", {
    params: {
      start,
      limit,
    },
  });
  console.log(
    "🚀🚀🚀 fetchCommissionHistory response:",
    JSON.stringify(response.data.data)
  );
  return extractData<FetchCommissionHistoryResponse>(response);
};

export const fetchHistoryReport = async () => {
  try {
    console.log("🚀🚀🚀 fetchHistoryReport");
    const response = await primaryApi.get("/content-trade/history/report");
    console.log("🚀🚀🚀 fetchHistoryReport response:", response.data.data);
    return extractData<HistoryReportData>(response);
  } catch (error) {
    console.error("Error fetching history report:", error);
    return { commissionAmount: "0", tradeCount: "0" };
  }
};
