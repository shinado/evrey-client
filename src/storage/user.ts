import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage, STORAGE_KEYS } from "./config";
import { UserInfoData } from "../types";
import { QueryClient } from "@tanstack/react-query";

export const UserStorage = {
  async getUserInfo(): Promise<UserInfoData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get user info:", error);
      return null;
    }
  },

  async setUserInfo(userInfo: UserInfoData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_INFO,
        JSON.stringify(userInfo)
      );
    } catch (error) {
      console.error("Failed to save user info:", error);
    }
  },

  async clearUserInfo(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
    } catch (error) {
      console.error("Failed to clear user info:", error);
    }
  },

  async handleSignOut(queryClient?: QueryClient): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO);
      await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.SOLANA_PRIVATE_KEY);
      await secureStorage.removeItem(STORAGE_KEYS.EXPIRES_IN);
      await secureStorage.removeItem(STORAGE_KEYS.LOGIN_TYPE);

      if (queryClient) {
        queryClient.removeQueries({ queryKey: ['tokensAggregate'] });
        queryClient.removeQueries({ queryKey: ['balance'] });
        queryClient.removeQueries({ queryKey: ['watchlist'] });
        queryClient.removeQueries({ queryKey: ['tokenBalance'] });
      }
    } catch (error) {
      console.error("Failed to clear user info:", error);
    }
  },
};