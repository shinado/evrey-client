import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { UserStorage } from '../storage';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEB_APP_URL = 'https://www.story.fun/';
const INVITATION_CODE_KEY = 'pending_invitation_code';
const INVITATION_QUERY_KEY = 'ref';

declare const window: any;

export enum AppEnvironment {
  TELEGRAM = 'telegram',
  MOBILE_IOS = 'mobile_ios',
  MOBILE_ANDROID = 'mobile_android',
  WEB = 'web'
}

export const inviteService = {
  // 环境检测
  detectEnvironment: (): AppEnvironment => {
    if (Platform.OS === 'ios') return AppEnvironment.MOBILE_IOS;
    if (Platform.OS === 'android') return AppEnvironment.MOBILE_ANDROID;
    if (Platform.OS === 'web' && window?.navigator) {
      const { userAgent } = window.navigator;
      if (/telegram/i.test(userAgent)) return AppEnvironment.TELEGRAM;
      if (/iPhone|iPad|iPod/i.test(userAgent)) return AppEnvironment.MOBILE_IOS;
      if (/Android/i.test(userAgent)) return AppEnvironment.MOBILE_ANDROID;
    }
    return AppEnvironment.WEB;
  },

  // 生成邀请链接
  generateInviteLink: async (): Promise<string> => {
    const userInfo = await UserStorage.getUserInfo();
    if (!userInfo?.invitationCode) {
      throw new Error('No invitation code found');
    }
    return `${WEB_APP_URL}?${INVITATION_QUERY_KEY}=${userInfo.invitationCode}`;
  },

  // 复制到剪贴板
  copyToClipboard: async (text: string): Promise<void> => {
    try {
      await Clipboard.setStringAsync(text);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invite link copied to clipboard',
        position: 'bottom',
        bottomOffset: 60,
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Copy Failed',
        text2: 'Please try again',
        position: 'bottom',
        bottomOffset: 60,
        visibilityTime: 1500,
      });
    }
  },

  // 修改分享功能
  shareInvite: async (): Promise<void> => {
    try {
      const inviteLink = await inviteService.generateInviteLink();
      
      try {
        await Share.share({
          message: 'Join Evrey with my link: ' + inviteLink,
          title: 'Join Evrey',
          url: inviteLink,  // iOS only
        });
      } catch (err) {
        // 如果分享失败，回退到复制
        await inviteService.copyToClipboard(inviteLink);
      }
    } catch (error) {
      console.error('Share failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Share failed',
        text2: 'Please try again later',
        position: 'bottom',
        visibilityTime: 1500,
      });
    }
  },

  // 解析邀请链接
  parseInviteLink: (url: string): string | undefined => {
    try {
      return new URL(url).searchParams.get(INVITATION_QUERY_KEY) || undefined;
    } catch (error) {
      console.error('URL parsing error:', error);
      return undefined;
    }
  },

  // 统一处理邀请链接
  handleInvitationUrl: async (url: string): Promise<string | null> => {
    try {
      const invitationCode = inviteService.parseInviteLink(url);
      if (invitationCode) {
        await AsyncStorage.setItem(INVITATION_CODE_KEY, invitationCode);
        return invitationCode;
      }
      return null;
    } catch (error) {
      console.error('Handle invitation URL error:', error);
      return null;
    }
  },

  // 获取待处理的邀请码
  getPendingInvitationCode: async (): Promise<string | null> => {
    try {
      const code = await AsyncStorage.getItem(INVITATION_CODE_KEY);
      if (code) {
        await AsyncStorage.removeItem(INVITATION_CODE_KEY);
        return code;
      }
      return null;
    } catch (error) {
      console.error('Get pending invitation code error:', error);
      return null;
    }
  },
}; 