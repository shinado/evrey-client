import "./global";
import React, { useRef, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, AppState, Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Root as PopupRootProvider } from "@sekizlipenguen/react-native-popup-confirm-toast";
import { ToastProvider } from "./src/contexts/ToastContext";
import { TradeProvider } from "./src/contexts/TradeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAppInit } from "./src/hooks/useAppInit";
import { ExpiresInStorage, TokenStorage, UserStorage, DeviceStorage } from "./src/storage";
import { inviteService, queryClient, AppLaunchManagerService, deviceService, authService, reportService } from "./src/services";
import { AppLaunchManager, IsFirstLaunchStorage } from "./src/storage";
import { getMessaging, getToken, onMessage, onTokenRefresh } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { UploadProvider } from "./src/contexts/UploadContext";
import { RootNav } from "./src/navigation";
import { LanguageProvider } from "./src/contexts/LanguageContext";

// 配置通知处理程序
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 请求通知权限
const requestNotificationPermission = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('请求通知权限失败:', err);
    return false;
  }
};

// 获取 FCM Token 并存储
const getFCMToken = async () => {
  try {
    // 先检查本地存储中是否已有 token
    const storedToken = await DeviceStorage.getFCMToken();
    if (storedToken) {
      console.log('使用已存储的 FCM Token:', storedToken);
      return storedToken;
    }

    // 本地没有 token，从 Firebase 获取新的 token
    const token = await getToken(getMessaging());
    console.log('获取新的 FCM Token:', token);
    await DeviceStorage.setFCMToken(token);
    return token;
  } catch (error) {
    console.error('获取 FCM Token 失败:', error);
    return null;
  }
};

// 监听 token 刷新
const setupTokenRefreshListener = () => {
  const messaging = getMessaging();
  return onTokenRefresh(messaging, async (token) => {
    console.log('FCM Token 已刷新:', token);
    await DeviceStorage.setFCMToken(token);
    // 获取当前设备id
    const deviceId = await DeviceStorage.getDeviceId();
    if (deviceId) {
      // 更新当前设备的 token
      await deviceService.updateDeviceMessagingToken(deviceId, token);
    }
  });
};

function App() {
  useAppInit();
  const appState = useRef(AppState.currentState);

  // 处理 token 刷新
  const handleTokenRefresh = async () => {
    const token = await TokenStorage.getToken();
    const timestamp = await ExpiresInStorage.get();
    if (timestamp && token) {
      const currentTime = Date.now();
      const isFuture = +timestamp > currentTime;
      if (isFuture) {
        authService.scheduleTokenRefresh(+timestamp);
      } else {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            await authService.refreshToken(refreshToken);
          } catch (e) {
            UserStorage.clearUserInfo();
          }
        }
      }
    }
  };

  // 初始化 App 启动管理器和首次启动标记
  useEffect(() => {
    const init = async () => {
      // 初始化 App 启动管理器
      const res = await AppLaunchManager.getAppLaunchManager();
      if (!res) {
        const remoteRes = await AppLaunchManagerService.getAppLaunchManager();
        AppLaunchManager.setAppLaunchManager(remoteRes);
      }

      // 首次启动标记逻辑
      await IsFirstLaunchStorage.setIsFirstLaunch("false");
    };

    init();
  }, []);

  // 处理 deep link
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (url) {
        await inviteService.handleInvitationUrl(url);
      }
    };

    if (Platform.OS !== "web") {
      // 监听热启动
      Linking.addEventListener("url", handleDeepLink);
    }
    // 处理冷启动
    Linking.getInitialURL().then(async (url) => {
      if (url) {
        await inviteService.handleInvitationUrl(url);
      }
    });

    return () => {
      if (Platform.OS !== "web") {
        Linking.removeAllListeners && Linking.removeAllListeners("url");
      }
    };
  }, []);

  // 监听 AppState，处理 token 刷新和触达数据上报
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // 检查 token 是否即将过期（5分钟内）
        const token = await TokenStorage.getToken();
        const timestamp = await ExpiresInStorage.get();
        if (timestamp && token) {
          const currentTime = Date.now();
          const remainingTime = +timestamp - currentTime;
          // 只有在 token 即将过期时才刷新
          if (remainingTime <= 5 * 60 * 1000) {
            await handleTokenRefresh();
          }
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // 应用进入后台或非活跃状态时，立即上报触达数据
        await reportService.flushAll();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // 初始化通知权限和 FCM
  useEffect(() => {
    if (Platform.OS === "web") return;
    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await getFCMToken();
      }
    };

    initNotifications();

    // 监听前台消息
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, async remoteMessage => {
      console.log('收到前台消息:', remoteMessage);
      // 使用 expo-notifications 显示本地通知
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || '新消息',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null,
      });
    });

    // 监听后台消息
    messaging.setBackgroundMessageHandler(async remoteMessage => {
      console.log('收到后台消息:', remoteMessage);
      // 后台消息会自动显示通知，不需要额外处理
    });

    // 监听 token 刷新
    const tokenRefreshUnsubscribe = setupTokenRefreshListener();

    return () => {
      unsubscribe();
      tokenRefreshUnsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ToastProvider>
              <TradeProvider>
                  <UploadProvider>
                    <PopupRootProvider>
                      <StatusBar barStyle="dark-content" backgroundColor="white" />
                      <RootNav />
                    </PopupRootProvider>
                  </UploadProvider>
              </TradeProvider>
            </ToastProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
