import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./config";
import { UiToken } from "../types/token";

export const RecentTokenStorage = {
  async getRecentTokens(): Promise<UiToken[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_TOKENS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting recent tokens:", error);
      return [];
    }
  },

  async addRecentToken(token: UiToken): Promise<void> {
    try {
      const recentTokens = await this.getRecentTokens();
      const filteredTokens = recentTokens.filter((t) => t.mint !== token.mint);
      const newTokens = [token, ...filteredTokens].slice(0, 10);
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_TOKENS,
        JSON.stringify(newTokens)
      );
    } catch (error) {
      console.error("Error adding recent token:", error);
    }
  },

  async clearRecentTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_TOKENS);
    } catch (error) {
      console.error("Error clearing recent tokens:", error);
    }
  },
};

export const RecentSearchStorage = {
  async getRecentSearches(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting recent searches:", error);
      return [];
    }
  },

  async addRecentSearch(search: string): Promise<void> {
    try {
      const recentSearches = await this.getRecentSearches();
      const filteredSearches = recentSearches.filter((s) => s !== search);
      const newSearches = [search, ...filteredSearches].slice(0, 10);
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_SEARCHES,
        JSON.stringify(newSearches)
      );
    } catch (error) {
      console.error("Error adding recent search:", error);
    }
  },

  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  },
};