import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { UserInfoData } from '../types';
import { UserStorage } from '../storage';
import { NavigatorName } from '../constants/navigation';
import { NavigationService } from '../navigation/service';
import { authService } from '../services/user/auth';


export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);

  const loadUserInfo = useCallback(async () => {
    try {
      // 1. 先从本地获取
      const cachedUserInfo = await UserStorage.getUserInfo();
      setUserInfo(cachedUserInfo);

      // 2. 静默更新远程数据
      const remoteUserInfo = await authService.getUserInfo();
      setUserInfo(remoteUserInfo);
      await UserStorage.setUserInfo(remoteUserInfo);
    } catch (error) {
      console.error('Error loading user info:', error);
      UserStorage.clearUserInfo();
      NavigationService.reset(NavigatorName.AUTH_STACK);
    }
  }, []);

  // 只在页面获得焦点时更新
  useFocusEffect(useCallback(() => {
    loadUserInfo();
  }, [loadUserInfo]));

  return {
    userInfo,
    refreshUserInfo: loadUserInfo,
  };
};
