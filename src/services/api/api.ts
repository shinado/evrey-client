import {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosInstance,
} from "axios";
import { TokenStorage } from "../storage";
import i18n from "../../i18n";
import { RouterName } from "../../constants/navigation";
import { reset } from "../../utils/NavigationService";
import clearUserData from "../../utils/handleSignOutUtils";
import { refreshTokenIfNeeded } from "../core/auth/tokenManager";
import { primaryApi, aiboxApi, socialMediaApi } from "./apiClient";

// 更新 BaseResponse 接口以匹配新的 API 响应格式
interface BaseResponse<T = any> {
  rid: string;
  code: number;
  message: string;
  ts: number;
  data: T;
}

interface SuccessResponse {
  rid: string;
  code: number;
  message: string;
  ts: number;
  [property: string]: any;
}

// 更新 extractData 函数以处理没有 data 字段的情况
export function extractData<T>(response: AxiosResponse<BaseResponse<T>>): T {
  if (response.data.code !== 200 && response.data.code !== 0) {
    throw {
      code: response.data.code,
      message: response.data.message,
    };
  }
  return response.data.data;
}

// 添加一个处理操作型 API 响应的函数（没有 data 字段）
export function extractSuccess(
  response: AxiosResponse<SuccessResponse>
): boolean {
  if (response.data.code !== 200) {
    throw new Error(
      `API Error (${response.data.code}): ${response.data.message}`
    );
  }
  return true;
}

export function extractErrorMessage<T>(
  response: AxiosResponse<BaseResponse<T>>
): T {
  if (response.data.code !== 0) {
    throw new Error(`${response.data.message}`);
  }
  return response.data.data;
}



// 是否需要重试
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}





// 为每个 API 实例设置拦截器
setupInterceptors(primaryApi);
setupInterceptors(aiboxApi);
setupInterceptors(socialMediaApi);

export { primaryApi, aiboxApi, socialMediaApi };