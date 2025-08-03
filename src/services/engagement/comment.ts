import { CommentList, ReplyList } from "../../types";
import { primaryApi } from "../http/apiClient";
import { extractData, extractSuccess } from "../http/responseHandler";

export const commentService = {
    async getCommentList(params: { start: string; limit: string, postId: string }) {
        console.log("🚀🚀🚀 getCommentList params:", params);
        const response = await primaryApi.get(`/engagement/comments`, { params });
        console.log("🚀🚀🚀 getCommentList response:", JSON.stringify(response?.data));
        return extractData<CommentList>(response);
    },
    async getReplyList(params: { start: string; pageSize: string, postId: string, commentId: string }) {
        const response = await primaryApi.get(`/engagement/comments/replies`, { params });
        return extractData<ReplyList>(response);
    },
    async likeComment(commentId: string) {
        const response = await primaryApi.put(`/engagement/comments/like/${commentId}`);
        return extractSuccess(response);
    },
    async unlikeComment(commentId: string) {
        const response = await primaryApi.delete(`/engagement/comments/like/${commentId}`);
        return extractSuccess(response);
    },
    async createComment(params: { postId: number, content: string, repliedId?: number, repliedTopId?: number }) {
        console.log("🚀🚀🚀 createComment params:", params);
        const response = await primaryApi.post(`/engagement/comments`, params);
        console.log("🚀🚀🚀 createComment response:", response?.data);
        return extractSuccess(response);
    }
}