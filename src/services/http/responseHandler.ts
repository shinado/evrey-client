import { AxiosResponse } from "axios";

// API 响应格式接口
export interface BaseResponse<T = any> {
  rid: string;
  code: number;
  message: string;
  ts: number;
  data: T;
}

export interface SuccessResponse {
  rid: string;
  code: number;
  message: string;
  ts: number;
  [property: string]: any;
}

// 处理带 data 字段的响应
export function extractData<T>(response: AxiosResponse<BaseResponse<T>>): T {
  if (response.data.code !== 200 && response.data.code !== 0) {
    throw {
      code: response.data.code,
      message: response.data.message,
    };
  }
  return response.data.data;
}

// 处理操作型 API 响应（没有 data 字段）
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


  