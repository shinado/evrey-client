import {AxiosInstance} from "axios";
import { ExpiresInStorage, TokenStorage, UserStorage } from "../../storage";
import i18n from "../../i18n";
import { NavigatorName, RouterName } from "../../constants/navigation";
import { primaryApi, aiboxApi } from "./apiClient";
import { NavigationService } from "../../navigation/service";


async function refreshTokenIfNeeded() {
    const refreshToken = await TokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");
    
    try {
      const response = await primaryApi.post(
        `/user/auth/refresh-token`,
        { refreshToken }
      );
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
      await TokenStorage.setToken(accessToken, newRefreshToken);
      await ExpiresInStorage.set(expiresIn.toString());
      return accessToken;
    } catch (error) {
      throw new Error("Refresh token failed");
    }
  } 

// 是否需要重试
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// 请求拦截器
const setupInterceptors = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.request.use(async (config) => {
    try {
      config.headers["language"] = i18n.locale;
      const token = await TokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  });

  // 第二个响应拦截器处理重试逻辑
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      if (response?.status === 401) {
        // 防止无限循环
        if (config._retry) {
          UserStorage.handleSignOut();
          NavigationService.reset(NavigatorName.AUTH_STACK);
          return Promise.reject(error);
        }
        config._retry = true;
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const accessToken = await refreshTokenIfNeeded();
            isRefreshing = false;
            onRefreshed(accessToken);
          } catch (e) {
            isRefreshing = false;
            UserStorage.handleSignOut();
            NavigationService.reset(NavigatorName.AUTH_STACK);
            return Promise.reject(e);
          }
        }
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(apiInstance(config));
          });
        });
      }else{
        console.log("❌ Response Error:", {
          status: response?.status,
          data: response?.data,
          url: config?.url,
        });
        // 处理网络错误重试
        if (!response || response.status === 500) {
          const retryConfig = config as any;
          if (!retryConfig) return Promise.reject(error);
          const retries = retryConfig._retryCount || 0;
          if (retries < 2) {
            console.log("Retrying request🫠...");
            const retryDelay = (retries + 1) * 1000;

            retryConfig._retryCount = retries + 1;

            return new Promise((resolve) => {
              setTimeout(() => resolve(apiInstance(retryConfig)), retryDelay);
            });
          }

          console.log("❌ Maximum retry attempts reached, request failed");
        }
      } 
      return Promise.reject(error);
    }
  );
};

// 为每个 API 实例设置拦截器
setupInterceptors(primaryApi);
setupInterceptors(aiboxApi);
//setupInterceptors(socialMediaApi);

export { primaryApi, aiboxApi }; 