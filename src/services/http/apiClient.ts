import axios from "axios";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

export const ENV = __DEV__ ? "DEV" : "PROD";

export const BASE_URLS = {
  primary: {
    DEV: "https://api.evrey.xyz",
    PROD: "https://api.evrey.xyz",
  },
  aibox_service: {
    DEV: "https://api.evrey.xyz",
    PROD: "https://api.evrey.xyz",
  },
  social_media: {
    DEV: "https://evrey-news-backend-production.up.railway.app",
    PROD: "https://evrey-news-backend-production.up.railway.app",
  }
};

export const SOCKET_URLS = {
  DEV: {
    SOCKET_URL: "wss://api.evrey.xyz/ws-kline",
    SOCKET_PATH: "/ws-kline/socket.io"
  },
  PROD: {
    SOCKET_URL: "wss://api.evrey.xyz/ws-kline",
    SOCKET_PATH: "/ws-kline/socket.io"
  }
}

export const PlatformType = {
  ios: "0",
  android: "1",
  web: "2",
  windows: "3",
  macos: "4",
};

// 动态获取域名
const getBaseUrl = (service: keyof typeof BASE_URLS) => BASE_URLS[service][ENV];

// 创建 API 实例
const createApiInstance = (baseURL: string) => {
  return axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      "PLATFORM-TYPE": PlatformType[Platform.OS],
      "APP-VERSION": DeviceInfo.getVersion(),
    },
  });
};

// 创建多个 API 实例
export const primaryApi = createApiInstance(getBaseUrl("primary"));
export const aiboxApi = createApiInstance(getBaseUrl("aibox_service"));
export const socialMediaApi = createApiInstance(getBaseUrl("social_media")); 