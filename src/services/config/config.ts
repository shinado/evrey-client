import { primaryApi } from "../http/apiClient";
import { extractData } from "../http/responseHandler";
import { AppLaunchManagerData } from "../../types";
import { AppLaunchManager } from "../../storage";

type TradeMode = 'buy' | 'sell' | 'withdraw' | 'transfer';

// 备用阈值设置
const FALLBACK_THRESHOLDS = {
  buy: {
    minAmount: 2,
  },
  sell: {
    minAmount: 2,
  },
  withdraw: {
    minAmount: 5,
    securityThreshold: 500,
  },
  transfer: {
    minAmount: 5,
    securityThreshold: 500,
  },
} as const;

export interface ThresholdResult {
  minAmount: number;
  securityThreshold?: number;
}

export const AppLaunchManagerService = {
  getAppLaunchManager: async () => {
    const response = await primaryApi.get(`/coins/trade/settings`);
    console.log("AppLaunchManagerService.getAppLaunchManager response:", response);
    return extractData<AppLaunchManagerData>(response);
  },

  getThresholds: async (mode: TradeMode): Promise<ThresholdResult> => {
    try {
      // 1. 首先尝试从缓存获取
      let settings = await AppLaunchManager.getAppLaunchManager();

      // 2. 如果缓存中没有，则从接口获取
      if (!settings) {
        settings = await AppLaunchManagerService.getAppLaunchManager();
        // 获取成功后，存入缓存
        if (settings) {
          await AppLaunchManager.setAppLaunchManager(settings);
        }
      }

      console.log('settings: ', settings);

      // 3. 根据不同模式返回对应的阈值
      switch (mode) {
        case 'buy':
          return {
            minAmount: settings.minBuyAmountUsd,
          };

        case 'sell':
          return {
            minAmount: settings.minSellAmountUsd,
          };

        case 'withdraw':
          return {
            minAmount: settings.withdrawMinAmountUsd,
            securityThreshold: settings.securityThresholdAmountUsd,
          };

        case 'transfer':
          return {
            minAmount: settings.internalTransferMinAmountUsd,
            securityThreshold: settings.securityThresholdAmountUsd,
          };

        default:
          throw new Error('Invalid trade mode');
      }
    } catch (error) {
      console.warn('Fallback thresholds', error);
      return FALLBACK_THRESHOLDS[mode];
    }
  },
};
