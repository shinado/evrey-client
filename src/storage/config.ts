import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const STORAGE_KEYS = {
  // normal storage
  USER_INFO: "user_info",
  RECENT_TOKENS: "recent_tokens",
  RECENT_SEARCHES: "recent_searches",
  NOTIFICATION_SETTINGS: "notification_settings",
  DEVICE_ID: "device_id",
  KEYPAIR_LIST: "keypair_list",
  FCM_TOKEN: "fcm_token",
  POST_DRAFTS: "post_drafts",
  LOGIN_TYPE: "login_type",

  // secure storage
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  SOLANA_PRIVATE_KEY: "solana_private_key",
  IS_FIRST_LAUNCH: "is_first_launch",
  APP_LAUNCH_MANAGER: "app_launch_manager",
  EXPIRES_IN: 'expires_in',
} as const;

export const secureStorage =
  Platform.OS === "web"
    ? {
        setItem: AsyncStorage.setItem,
        getItem: AsyncStorage.getItem,
        removeItem: AsyncStorage.removeItem,
      }
    : {
        setItem: SecureStore.setItemAsync,
        getItem: SecureStore.getItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };