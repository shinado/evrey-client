import { mapToUiToken } from "src/types";
import { primaryApi } from "../http/apiClient";
import { extractSuccess } from "../http/responseHandler";

export const favoriteService = {
    async getFavorites(page: number, pageSize: number) {
        console.log(`🚀🚀🚀 getFavorites params:`, { page, pageSize });
        const response = await primaryApi.get(`/engagement/favorites`, {
            params: {
                page,
                page_size: pageSize,
            },
        });
        console.log(`🚀🚀🚀 getFavorites response:`, response?.data?.data);
        const rawData = response?.data?.data;
        const list = rawData?.list?.map((post: any) => ({
            ...post,
            coin: mapToUiToken(post.coin),
        }));
        return {
            ...rawData,
            list,
        };
    },
    async addFavorite(postId: string) {
        const response = await primaryApi.put(`/engagement/favorites/favorite/${postId}`);
        console.log('💰 addFavorite', response.data.code);
        return extractSuccess(response);
    },
    async removeFavorite(postId: string) {
        const response = await primaryApi.delete(`/engagement/favorites/favorite/${postId}`);
        console.log('💰 removeFavorite', response.data.code);
        return extractSuccess(response);
    }
}