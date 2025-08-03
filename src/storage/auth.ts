import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage, STORAGE_KEYS } from "./config";

// 登录方式枚举
export enum LoginType {
  EMAIL = 'email',
  WALLET = 'wallet'
}

export const TokenStorage = {
  async getRefreshToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  },

  async setToken(token: string, refreshToken: string): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      console.log("authToken saved:", token);
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error("Failed to remove token:", error);
    }
  },

  async removeRefreshToken(): Promise<void> {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Failed to remove refresh token:", error);
    }
  },
};

export const ExpiresInStorage = {
  async get(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_IN) || null;
  },

  async set(value: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPIRES_IN, value);
  },
};

export const LoginTypeStorage = {
  async getLoginType(): Promise<LoginType | null> {
    try {
      const loginType = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TYPE);
      return loginType as LoginType | null;
    } catch (error) {
      console.error("Failed to get login type:", error);
      return null;
    }
  },

  async setLoginType(loginType: LoginType): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TYPE, loginType);
      console.log("Login type saved:", loginType);
    } catch (error) {
      console.error("Failed to save login type:", error);
    }
  },
};