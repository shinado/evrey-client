import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from 'react';
import { format, formatDistanceToNow, differenceInHours, differenceInDays, differenceInMonths } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import i18n from '../i18n';

type IconName = ComponentProps<typeof Ionicons>['name'];

// 价格变化配置
const PRICE_CHANGE_CONFIG = {
  UP: {
    color: Theme.ascend,
    icon: 'caret-up' as IconName,
  },
  DOWN: {
    color: Theme.descend,
    icon: 'caret-down' as IconName,
  },
  UNCHANGED: {
    color: Theme.text[100],
    icon: null,
  }
};

// 获取价格变化状态
const getPriceChangeStatus = (percentage: number) => {
  if (percentage > 0) return 'UP';
  if (percentage < 0) return 'DOWN';
  return 'UNCHANGED';
};

// 通用的数值转换函数
const toNumber = (value: any): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * 格式化价格，根据不同区间使用不同精度
 * < 0.0000001 显示科学计数法
 * < 1 显示 7 位小数
 * < 10 显示 4 位小数
 * >= 10 显示 2 位小数
 */
const formatPrice = (value: any): string => {
  // **确保值是数字**
  const num = toNumber(value);
  if (num === null) return '---';
  if (num === 0) return '0.00';

  // **小于 0.0000001 时，保留 7 位小数并向下取整**
  if (Math.abs(num) < 0.0000001) {
    return (Math.floor(num * 1e7) / 1e7).toFixed(7).replace(/\.?0+$/, "");
  }

  // **不同区间的向下取整**
  if (Math.abs(num) < 1) {
    return (Math.floor(num * 1e7) / 1e7).toFixed(7).replace(/\.?0+$/, "");
  }
  if (Math.abs(num) < 10) {
    return (Math.floor(num * 1e4) / 1e4).toFixed(4).replace(/\.?0+$/, "");
  }
  return (Math.floor(num * 1e2) / 1e2).toFixed(2).replace(/\.?0+$/, "");
};

/**
 * 格式化百分比
 * 保留 2 位小数
 * 添加 % 符号
 * 取绝对值, 前面会加上下标
 */
const formatPercentage = (value: any): string => {
  const num = toNumber(value);
  if (num === null) return '---';
  if (num === 0) return '0.00%';
  return `${Math.abs(num).toFixed(2)}%`;
};

const formatPercentageWithSign = (value: any): string => {
  const num = toNumber(value);
  if (num === null) return '---';
  if (num === 0) return '0.00%';
  return `${num > 0 ? '+' : num < 0 ? '-' : ''}${Math.abs(num).toFixed(2)}%`;
};

/**
 * 格式化市值/成交量
 * < 1K 显示原值
 * >= 1K 显示为 K
 * >= 1M 显示为 M
 * >= 1B 显示为 B
 * >= 1T 显示为 T
 */
const formatAmount = (value: any, prefix = '$'): string => {
  const num = toNumber(value);
  if (num === null) return `${prefix}---`;
  if (num === 0) return `${prefix}0.00`;

  const absNum = Math.abs(num);
  if (absNum >= 1e12) {
    return `${prefix}${(num / 1e12).toFixed(2).replace(/\.?0+$/, "")}T`;
  }
  if (absNum >= 1e9) {
    return `${prefix}${(num / 1e9).toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (absNum >= 1e6) {
    return `${prefix}${(num / 1e6).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (absNum >= 1e3) {
    return `${prefix}${(num / 1e3).toFixed(2).replace(/\.?0+$/, "")}K`;
  }
  return `${prefix}${num.toFixed(2).replace(/\.?0+$/, "")}`;
};

/**
 * 格式化数量
 * 保留 4 位小数
 * 大于 10000 显示为 xx.xx万
 */
const formatQuantity = (value: any): string => {
  const num = toNumber(value);
  if (num === null) return '---';
  if (num === 0) return '0.0000';

  if (num >= 10000) {
    return `${(num / 10000).toFixed(2).replace(/\.?0+$/, "")}万`;
  }
  return num.toFixed(4).replace(/\.?0+$/, "");
};

/**
 * 格式化代币数量
 * 向下取整保留 4 位小数
 */
const formatTokenQuantity = (value: any): string => {
  const num = toNumber(value);
  if (num === null) return '---';
  if (num === 0) return '0.0000';
  return (Math.floor(num * 1e4) / 1e4).toFixed(4);
};

/**
 * 格式化地址
 * 保留头 6 位和尾 4 位
 */
const formatAddress = (address: string): string => {
  if (!address || typeof address !== 'string' || address.length < 10) {
    return address || '---';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 格式化地址，保留头 4 位和尾 4 位
 */
const formatAddressShort = (address: string): string => {
  if (!address || typeof address !== 'string' || address.length < 8) {
    return address || '---';
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * 根据价格变化返回对应的图标和颜色
 */
export const getPriceChangeIconAndColor = (percentage: number) => {
  const changeStatus = getPriceChangeStatus(percentage);
  return PRICE_CHANGE_CONFIG[changeStatus];
};

// 时间格式化相关函数
const getLocale = () => {
  return i18n.locale === 'zh' ? zhCN : enUS;
};

/**
 * 格式化日期（使用 toLocaleDateString，显示完整月份名称）
 */
export const formatDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language, { 
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 将 UTC 时间转换为本地时间字符串（简洁格式）
 */
const formatUTCTime = (utcString: string) => {
  return format(new Date(utcString), 'yyyy/MM/dd HH:mm:ss', { locale: getLocale() });
};

/**
 * 获取时间差描述（例如：3小时前）
 */
const formatTimeAgo = (utcString: string) => {
  if (!utcString) return '';
  
  try {
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return '';

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: getLocale(),
    });
  } catch (error) {
    console.warn('Invalid date format:', utcString);
    return '';
  }
};

/**
 * 时间分类类型
 */
type TimeCategory =
  | 0 // 小于 4 小时
  | 1 // 4 小时 <= 时间 < 1 天
  | 2 // 1 天 <= 时间 < 1 周
  | 3 // 1 周 <= 时间 < 1 个月
  | 4 // 1 个月 <= 时间 < 3 个月
  | 5 // 3 个月 <= 时间 < 6 个月
  | 6; // 大于 6 个月

/**
 * 获取时间分类
 */
const getTimeCategory = (eventTimeStr: string): TimeCategory => {
  try {
    const eventTime = new Date(eventTimeStr);
    const now = new Date();

    const hoursDiff = differenceInHours(now, eventTime);
    const daysDiff = differenceInDays(now, eventTime);
    const monthsDiff = differenceInMonths(now, eventTime);

    if (hoursDiff < 4) return 0;
    if (hoursDiff >= 4 && daysDiff < 1) return 1;
    if (daysDiff >= 1 && daysDiff < 7) return 2;
    if (daysDiff >= 7 && daysDiff < 30) return 3;
    if (monthsDiff >= 1 && monthsDiff < 3) return 4;
    if (monthsDiff >= 3 && monthsDiff < 6) return 5;
    return 6;
  } catch (error) {
    console.warn('Invalid date format:', eventTimeStr);
    return 0;
  }
};

export const formatUsername = (name: any): string => {
  if(!name) return '';
  const len = name.length;
  
  if (len <= 1) {
    // 只有一个字符时：x...
    return name + '...';
  } else if (len === 2) {
    // 两个字符时：x...x
    return name[0] + '...' + name[1];
  } else {
    // 三个及以上字符时：x...y
    return name[0] + '...' + name[len - 1];
  }
}

export const CoinFormatUtil = {
  formatPrice,        // 格式化价格
  formatPercentage,   // 格式化百分比
  formatAmount,       // 格式化金额（市值/成交量）
  formatQuantity,     // 格式化数量
  formatAddress,      // 格式化地址
  formatTokenQuantity, // 格式化代币数量
  formatPercentageWithSign, // 格式化百分比，带正负号
};

export const AddressFormatUtil = {
  formatAddress, // 格式化地址
  formatAddressShort, // 格式化地址，保留头 4 位和尾 4 位
};

export const TimeFormatUtil = {
  formatDate,      // 格式化日期（完整格式）
  formatUTCTime,   // 格式化 UTC 时间（简洁格式）
  formatTimeAgo,   // 格式化时间差
  getTimeCategory, // 获取时间分类
};



