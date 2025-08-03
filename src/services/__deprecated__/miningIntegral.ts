import { extractData, aiboxApi } from "../api/api";

export type BalanceData = {
  /**
   * 余额
   */
  amount: number;
  [property: string]: any;
};

export type RecordsData = {
  hasMore: boolean;
  list: RecordsList[];
  total: number;
  [property: string]: any;
};

export type RecordsList = {
  /**
   * 获取矿币数量
   */
  amount?: number;
  /**
   * 获取后当前余额
   */
  balance?: number;
  /**
   * 变动类型;0获取1消耗
   */
  changeType?: number;
  id?: number;
  /**
   * 获取时间
   */
  obtainedAt?: string;
  /**
   * 获取方式：0 点赞、1 分享、2 空投
   */
  obtainedType?: number;
  /**
   * 用户id
   */
  userId?: number;
  cover?: string;
  /**
   * 视频名称
   */
  videoName?: string;
  [property: string]: any;
};

interface ParamsPage {
  pageNo: number;
  pageSize: number;
}

export const MiningIntegralService = {
  /** 我的资产-meme币*/
  getUserMiningCoinsBalance: async () => {
    const response = await aiboxApi.get(`/video-service/user-mining-coins/balance`);
    return extractData<BalanceData>(response);
  },

  /** 获取积分记录列表*/
  getRecords: async (params: ParamsPage) => {
    const response = await aiboxApi.get(`/video-service/user-mining-coins/records`, {
      params: params,
    });
    return extractData<RecordsData>(response);
  },

  /** 获取积分记录列表*/
  getVideosDetail: async (id: number) => {
    const response = await aiboxApi.get(`/video-service/videos/${id}`);
    return extractData<RecordsData>(response);
  },
};
