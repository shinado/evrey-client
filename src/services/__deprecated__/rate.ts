import { Linking, Platform } from 'react-native';

const APP_STORE_ID = 'com.momo.abc';  // iOS bundleIdentifier
const PLAY_STORE_ID = 'com.momo.abc';  // Android package name

export const rateService = {
  openStore: async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS: 打开 App Store
        const link = `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`;
        await Linking.openURL(link);
      } else {
        // Android 和其他平台: 直接使用 Google Play 网页链接
        const link = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
        await Linking.openURL(link);
      }
    } catch (error) {
      console.error('Failed to open store:', error);
    }
  },
}; 