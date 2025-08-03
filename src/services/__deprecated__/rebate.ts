import { aiboxApi } from "../http/apiClient";
import { extractData } from "../http/responseHandler";

/** 🔹 返佣信息 */
export interface CommissionInfo {
  /**
   * 总返佣额
   */
  commissionTotalAmount: number;
  /**
   * 直接好友返佣额
   */
  directCommissionAmount: number;
  /**
   * 好友返佣额
   */
  inviteeCommission: number;
  /**
   * 我的返佣额
   */
  ownerCommission: number;
  [property: string]: any;
}


/** 🔹 返佣统计数据 */
export interface CommissionStatisticsData {
  /**
   * 总返佣金额
   */
  sum: string;
  /**
   * 邀请总人数
   */
  referralsCount: number;
}

/** 🔹 邀请好友列表 */
export interface InviteUsersData {
  id: string;
  wallet: string;
  username: string;
  nickname?: string;
  avatar?: string;
  referralId?: string;
  referralAt?: string;
  rewards?: number;
}


/** 返佣排行榜接口响应 */
export interface CommissionRankingData {
  id: string;
  username: string;
  wallet: string;
  nickname: string;
  avatar: string;
  referralId: string;
  referralAt: string;
  registerAt: string;
  referrals: number;
  amount: number;
}

export interface CommissionHistoryItem {
  id: string;
  userId: string;
  refereeId: string;
  amount: string;
  tradeAmount: string;
  feeAmount: string;
  tradeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionHistoryRequest {
  pageNo: number;
  pageSize: number;
}

export interface CommissionHistoryResponse {
  hasMore: boolean;
  next: number;
  list: CommissionHistoryItem[];
}

export const rebateService = {
  /** 🔹 获取邀请好友列表 */
  getInviteUsers: async (params: any) => {
    try {
      const response = await aiboxApi.get("/commission/referrals", {
        params,
      });

      return extractData<InviteUsersData>(response);
    } catch (error) {
      console.error("Error fetching invite users:", error);
      throw error;
    }
  },

  /** 🔹 获取佣金统计数据 */
  getCommissionStatistics: async () => {
    try {
      const [rewardsResult, referralsResult] = await Promise.allSettled([
        aiboxApi.get("/commission/rewards/report"),
        aiboxApi.get("/commission/referrals/count")
      ]);

      return {
        sum: rewardsResult.status === 'fulfilled' ? extractData<{ sum: string }>(rewardsResult.value).sum : "0",
        referralsCount: referralsResult.status === 'fulfilled' ? extractData<number>(referralsResult.value) : 0
      };
    } catch (error) {
      console.error("Error fetching commission statistics:", error);
      throw error;
    }
  },

  /** 🔹 获取佣金排行榜 */
  getCommissionRanking: async (type: '24h' | '7d' | 'max') => {
    try {
      const response = await aiboxApi.get(`/commission/rewards/rank/${type}`);
      return extractData<CommissionRankingData[]>(response);
    } catch (error) {
      console.error("Error fetching commission ranking:", error);
      throw error;
    }
  },


  /** 🔹 获取佣金转出记录 */
  getWithdrawRecords: async (params: { start?: number, limit: number }) => {
    try {
      const response = await aiboxApi.get("/commission/history", {
        params: {
          start: params.start ?? 0,
          limit: params.limit
        }
      });
      const data = extractData<{ has_more: boolean; next: number; list: CommissionHistoryItem[] }>(response);
      return {
        hasMore: data.has_more,
        next: data.next,
        list: data.list
      };
    } catch (error) {
      console.error("Error fetching commission history:", error);
      throw error;
    }
  }
};

