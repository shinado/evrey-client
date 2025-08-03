import { UserInfoData } from "./user";

export interface Reply {
    content: string;
    created_at: string;
    id: string;
    like_count: number;
    parent_id: string;
    post_id: string;
    replied_user_id: string;
    reply_count: number;
    root_id: string;
    user_id: string;
    user: UserInfoData;
    is_liked: boolean;
}

export interface Comment extends Reply {
    hasMoreReplies: boolean;
    replies: {
        has_more: boolean;
        list: Reply[];
    };
}

export interface CommentList {
    has_more: boolean;
    list: Comment[];
}

export interface ReplyList {
    has_more: boolean;
    list: Reply[];
}