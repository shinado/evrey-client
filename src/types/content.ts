import { UserInfoData } from "./user";
import { UiToken } from "./token";


export enum PostType {
    IMAGE = 1,
    VIDEO = 2,
    RICH_TEXT = 3,
}


export enum PostStatus {
    Draft = -1,       // 草稿/未发布
    Published = 0,    // 已发布
    Deleted = -99     // 已删除
}


export interface Media {
    images?: string[];
    videos?: string[];
}

export interface Post {
    author: UserInfoData;
    coin: UiToken;
    created_at: string;
    favoritesCount?: number;
    head_img: string;
    id: string;
    isFollowed?: boolean;
    isFavorited?: boolean;
    media: Media;
    mint_address: string;
    mint_chain: string;
    title: string;
    type: PostType;
    updated_at: string;
    content?: string;
    timeScore?: number;
    coinScore?: number;
    interactionScore?: number;
    manual_score?: number;
    totalScore?: number;
    commissionAmount?: number;
}