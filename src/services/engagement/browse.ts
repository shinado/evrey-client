import { mapToUiToken } from "../../types";
import { primaryApi } from "../http/apiClient";

export const browseService = {
  async getBrowseList(start?: number, limit: number = 10) {
    const params: { start?: number; limit: number } = { limit };
    if (start) {
      params.start = start;
    }
    console.log(`🚀🚀🚀 getBrowseList params: ${JSON.stringify(params)}`);
    const response = await primaryApi.get(`/engagement/views`, { params });
    const rawData = response?.data?.data;
    console.log("🚀🚀🚀 getBrowseList rawData", JSON.stringify(rawData));
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
