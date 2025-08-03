import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./config";

export const DeviceStorage = {
  async getDeviceId(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  },

  async setDeviceId(deviceId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  },

  async getFCMToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
  },

  async setFCMToken(fcmToken: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, fcmToken);
  },

  async getNotificationSettings(): Promise<{
    price_alert: boolean;
    referral_rewards: boolean;
  } | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return data ? JSON.parse(data) : null;
  },

  async setNotificationSettings(settings: {
    price_alert: boolean;
    referral_rewards: boolean;
  }): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      JSON.stringify(settings)
    );
  },
};