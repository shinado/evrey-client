import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./config";
import { AppLaunchManagerData } from "../types/system";

export const IsFirstLaunchStorage = {
  async getIsFirstLaunch(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.IS_FIRST_LAUNCH);
  },

  async setIsFirstLaunch(value: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_FIRST_LAUNCH, value);
  },
};

export const AppLaunchManager = {
  async getAppLaunchManager(): Promise<AppLaunchManagerData | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_LAUNCH_MANAGER);
    return data ? JSON.parse(data) : null;
  },

  async setAppLaunchManager(value: AppLaunchManagerData): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.APP_LAUNCH_MANAGER,
      JSON.stringify(value)
    );
  },
};