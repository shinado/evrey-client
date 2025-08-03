// types.ts

import { Post } from ".";
import { UiToken, Token } from "./token";
import { NavigatorName, RouterName } from "../constants/navigation";
import { NavigatorScreenParams } from '@react-navigation/native';
import { DraftPost } from "../storage/draft";
  

// Feed Stack 参数
export type FeedStackParamList = {
    [RouterName.FEED]: undefined;
    [RouterName.SEARCH]: undefined;
  };
  
  // Create Stack 参数
  export type CreateStackParamList = {
    [RouterName.CREATE_POST]: {token: UiToken};
    [RouterName.SEARCH_TOKEN]: undefined;
  };
  
  // Holdings Stack 参数
  export type HoldingsStackParamList = {
    [RouterName.HOLDINGS]: undefined;
    [RouterName.CASH_OUT]: {token: Token};
    [RouterName.DEPOSIT]: undefined;
    [RouterName.HISTORY_ORDERS]: undefined;
    [RouterName.PROFILE]: undefined;
    [RouterName.HOLDING_TOKEN]: undefined;
    [NavigatorName.SETTINGS_STACK]: NavigatorScreenParams<SettingsStackParamList>;
  };
  
  // Auth Stack 参数
  export type AuthStackParamList = {
    [RouterName.SIGN_IN]: undefined;
    [RouterName.VERIFICATION]: {
        email: string;
        deviceId: string;
        captchaId: string;
        referralCode?: string;
        type?: string;
    };
    [RouterName.INVITATIONCODESCREEN]: {
        redirectTo?: RouterName;
        pushType?: string;
        onComplete: () => Promise<string | null>;
        invitationCode?: string;
    };
  };
  
  // Common Stack 参数
  export type CommonStackParamList = {
    [RouterName.TOKEN_INFO]: { token: UiToken };
    [RouterName.FEED_DETAIL]: {
        item: Post;
        isPreview?: boolean;
        onPublish?: () => void;
    };
    [RouterName.CREATOR_PROFILE]: { creatorId: string };
    [RouterName.WEBVIEW]: { url: string, title: string };
  };

  // Settings Stack 参数
  export type SettingsStackParamList = {
    [RouterName.SETTINGS]: undefined;
    [RouterName.HELP_CENTER]: undefined;
    [RouterName.WALLET]: undefined;
  };
  

  export type RootStackParamList = {
    [RouterName.LANDING]: undefined;
    [NavigatorName.MAIN_TAB]: undefined;
    [NavigatorName.AUTH_STACK]: undefined;
  };


  export type MainTabParamList = {
    [RouterName.FEED]: undefined;
    [RouterName.SEARCH_TOKEN]: undefined;
    [NavigatorName.HOLDINGS_STACK]: undefined;
  };
  
// 创建页面的路由参数类型
export interface CreatePostRouteParams {
  token?: UiToken;
  isDraft?: boolean;
  draftId?: string;
  draftData?: DraftPost;
}
  