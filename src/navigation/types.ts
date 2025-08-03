import { Post } from 'src/types';
import { Token, UiToken } from 'src/types/token';
import { CreatePostRouteParams } from 'src/types/navigation';
import { RouterName, NavigatorName } from '../constants/navigation';
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  [RouterName.LANDING]: undefined;
  [NavigatorName.ONBOARDING_STACK]: NavigatorScreenParams<OnboardingStackParamList>;
  [NavigatorName.MAIN_TAB]: undefined;
  [NavigatorName.AUTH_STACK]: undefined;
  [RouterName.INTEREST_SELECTION]: { fromSettings?: boolean };
  [RouterName.TOKEN_INFO]: { token: UiToken; postId?: string };
  [RouterName.FEED_DETAIL]: {
    item: Post;
    isPreview?: boolean;
    onPublish?: () => void;
  };
  [RouterName.WEBVIEW]: {
    url: string;
    title: string;
  };
  [RouterName.CREATOR_PROFILE]: { creatorId: string };
  [RouterName.CREATE_POST]: CreatePostRouteParams;
  [RouterName.DRAFT_LIST]: undefined;
  [RouterName.SEARCH]: undefined;
  [RouterName.HISTORY_ORDERS]: undefined;
  [RouterName.CASH_OUT]: { token: Token };
  [RouterName.PROFILE]: undefined;
  [NavigatorName.SETTINGS_STACK]: NavigatorScreenParams<SettingsStackParamList>;
  [RouterName.HOLDING_TOKEN]: undefined;
  [RouterName.POST_COMMISSION]: undefined;
};

export type OnboardingStackParamList = {
  [RouterName.INTEREST_SELECTION]: { fromSettings?: boolean };
};

export type MainTabParamList = {
  [RouterName.FEED]: undefined;
  [RouterName.SEARCH_TOKEN]: undefined;
  [NavigatorName.HOLDINGS_STACK]: undefined;
};

export type HoldingsStackParamList = {
  [RouterName.HOLDINGS]: undefined;
  [RouterName.DEPOSIT]: undefined;
  [RouterName.SEND]: undefined;
  [RouterName.FOLLOWING]: undefined;
  [RouterName.FOLLOWERS]: undefined;
};

export type AuthStackParamList = {
  [RouterName.SIGN_IN]: undefined;
  [RouterName.VERIFICATION]: {
    email: string;
    deviceId: string;
    captchaId: string;
    referralCode?: string;
    type?: string;
  };
};

export type SettingsStackParamList = {
  [RouterName.SETTINGS]: undefined;
  [RouterName.HELP_CENTER]: undefined;
  [RouterName.WALLET]: undefined;
};
