import { primaryApi } from "../http/apiClient";
import { extractSuccess } from "../http/responseHandler";

export interface ImpressionData {
    postIds: number[];
}

/**
 * 批量上报触达数据
 */
export const reportImpressions = async (data: ImpressionData): Promise<void> => {
  const response = await primaryApi.post('/engagement/impressions/report', data);
  extractSuccess(response);
};