import { primaryApi } from "../http/apiClient";
import { extractData, extractSuccess } from "../http/responseHandler";
import { ExpiresInStorage, TokenStorage } from "../../storage";
import { getLocales } from 'expo-localization';
import { UserInfoData } from "../../types";
import { DeviceStorage } from "../../storage";
//import { cryptoService } from "./crypto";
//import { TokenStorage, UserStorage } from "./storage";
//import {RSA} from 'react-native-rsa-native';

export interface RequestCodeData {
  captchaId: string;
}

export interface SignInRequest {
  deviceId: string;
  captchaId: string;
  captcha: string;
  referralCode?: string;
  encryptPublicKey: string;
  country: string;
  language: string;
}

export interface WalletAuthenticateRequest {
  walletAddress: string;
  deviceId: string;
  walletType: string;
  encryptPublicKey: string;
  referralCode?: string;
  country: string;
  language: string;
}

export interface WalletData {
  address: string;
  bundle: string;
}

export interface AuthTokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}


export interface SignInResponseData {
  wallet: WalletData;
  auth: AuthTokenData;
  userinfo: UserInfoData;
}




export interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// 定时器 ID
let refreshTimer: NodeJS.Timeout | null = null;

export const authService = {
  /**
   * 注册或登录时请求验证码
   * @param params 请求验证码参数
   * @returns 请求验证码数据
   */
  requestCode: async (params: {
    email: string; 
    deviceId: string; 
  }): Promise<RequestCodeData> => {
    console.log("requestCode params", params);
      const response = await primaryApi.post(
        '/user/auth/login/request',
        params
      );
      console.log("requestCode response", response);
      return extractData<RequestCodeData>(response);
  },

  /**
   * 注册或登录时登录
   * @param deviceId 设备ID
   * @param captchaId 验证码ID
   * @param captcha 验证码
   * @param encryptPublicKey 加密公钥
   * @param referralCode 推荐码
   */
  signIn: async (
    deviceId: string,
    captchaId: string,
    captcha: string,
    encryptPublicKey: string,
    referralCode?: string
  ) => {
    // Get system language using expo-localization
    const locale = getLocales()[0];
    const language = locale?.languageTag || '';
    const country = locale?.regionCode?.toUpperCase() || '';

    const payload: SignInRequest = {
      deviceId,
      captchaId,
      captcha,
      encryptPublicKey,
      language,
      country,
      ...(referralCode && { referralCode })
    };

    const response = await primaryApi.post(
      "/user/auth/login",
      payload
    );
    return extractData<SignInResponseData>(response);
  },

  // /**
  //  * 设置用户平台码
  //  * @param uniqueCode 唯一码
  //  */
  // setUserPlatformCode: async (uniqueCode: string) => {
  //   const response = await primaryApi.post(
  //     `/personal-center-service/user-platform-code`,
  //     {
  //       uniqueCode,
  //     }
  //   );
  //   return extractData<any>(response);
  // },
  // getUserPlatformCode: async (params: { pageNo: number; pageSize: number }) => {
  //   const response = await primaryApi.get(
  //     `/personal-center-service/user-platform-code`,
  //     {
  //       params,
  //     }
  //   );
  //   console.log("response.status", response.status);
  //   return extractData<UserPlatformCodeData>(response);
  // },

  /**
   * 获取用户信息
   * @returns 用户信息
   */
  getUserInfo: async () => {
    const response = await primaryApi.get(`/user/auth/userinfo`);
    //console.log("💀 getUserInfo response", response.data);
    return extractData<UserInfoData>(response);
  },

  /**
   * 钱包认证
   * @param walletAddress 钱包地址
   * @param deviceId 设备ID
   * @param walletType 钱包类型
   * @param encryptPublicKey 加密公钥
   * @param referralCode 推荐码（可选）
   * @returns 钱包认证数据
   */
  authenticateWallet: async (
    walletAddress: string,
    deviceId: string,
    walletType: string,
    encryptPublicKey: string,
    referralCode?: string
  ) => {
    // Get system language using expo-localization
    const locale = getLocales()[0];
    const language = locale?.languageTag || '';
    const country = locale?.regionCode?.toUpperCase() || '';

    const payload: WalletAuthenticateRequest = {
      walletAddress,
      deviceId,
      walletType,
      encryptPublicKey,
      language,
      country,
      ...(referralCode && { referralCode })
    };

    const response = await primaryApi.post(
      "/user/auth/wallet/authenticate",
      payload
    );
    return extractData<SignInResponseData>(response);
  },


  // async getOssAvatarUploadCred() {
  //   const response = await primaryApi.get(
  //     `/public-simple-service/app/sts-credentials`
  //   );
  //   return extractData<UploadOssCredentials>(response);
  // },

  /**
   * 刷新token
   * @param refreshToken 刷新token
   * @returns 刷新token数据
   */
  refreshToken: async (refreshToken: string) => {
    const response = await primaryApi.post(
      `/user/auth/refresh-token`,
      { refreshToken }
    );
    return extractData<RefreshTokenData>(response);
  },

  logout: async () => {
    const response = await primaryApi.post('/user/auth/logout');
    return extractSuccess(response);
  },

  /**
   * 定时刷新token
   * @param expiresIn 过期时间
   */
  scheduleTokenRefresh: (expiresIn: number) => {
    // 计算剩余时间
    const remainingTime = expiresIn - Date.now();

    if (remainingTime <= 0) {
      console.log("Token 已经过期，立即刷新");
      // 立即刷新 token
      (async () => {
        const token = await TokenStorage.getRefreshToken();
        if (token) {
          try {
            const res = await authService.refreshToken(token);
            await TokenStorage.setToken(res.accessToken, res.refreshToken);
            await ExpiresInStorage.set(res.expiresIn.toString());
          } catch (e) {
            // 刷新失败可以清空用户数据或跳转登录
            console.log("刷新 token 失败", e);
          }
        }
      })();
      return;
    }

    // 格式化时间
    const formattedDate = new Date(expiresIn).toLocaleString();
    console.log("Token 过期时间：", formattedDate);

    // 重新计算倒计时
    const refreshTime = remainingTime - 5 * 60 * 1000; // 提前 5 分钟刷新

    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    if (refreshTime > 0) {
      //console.log(`Token 将在 ${refreshTime / 1000}s 后刷新`);
      refreshTimer = setTimeout(async () => {
        const token = await TokenStorage.getRefreshToken();
        console.log('刷新的 token',token);
        if (token) {
          const res = await authService.refreshToken(token);
          console.log('刷新结果 res',res);
          await TokenStorage.setToken(res.accessToken, res.refreshToken);
          await ExpiresInStorage.set(res.expiresIn.toString());
        }
      }, refreshTime);
    }
  },
};


