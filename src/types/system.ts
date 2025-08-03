/**
 * 数据
 *
 * trade_settings_data，数据
 */
export interface AppLaunchManagerData {
    feeRate: number;
    /**
     * 最小购买金额
     */
    minBuyAmountUsd: number;
    /**
     * 最小卖出金额
     */
    minSellAmountUsd: number;
    /**
     * 默认滑点
     */
    slippageBpsDefault: number;
    /**
     * 滑点允许最大值
     */
    slippageBpsMax: number;
    /**
     * 滑点允许最小值
     */
    slippageBpsMin: number;
    /**
     * 内部转账最小金额数
     */
    internalTransferMinAmountUsd: number;
    /**
     * 高安全认证金额阈值
     */
    securityThresholdAmountUsd: number;
    /**
     * 平台手续费
     */
    tradingFeeBps: number;
    /**
     * 提现最小金额
     */
    withdrawMinAmountUsd: number;
    [property: string]: any;
  }
  

  export interface VersionData {
    id: string;
    osType: string;
    version: string;
    versionStr: string;
    versionMin: string;
    versionMinStr: string;
    langVersion: string;
    langVersionStr: string;
    langUrl: string;
    apkUrl: string;
    description?: string;
  }
  