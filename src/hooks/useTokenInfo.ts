import { useQuery } from "@tanstack/react-query";
import { poolsService } from "../services/trading/pools";
import { CoinKlineData, TokenInfo, TimeframeKey, TokenData } from "../types/token";
import { useIsFocused } from "@react-navigation/native";
import { useLiveKlineSocketData } from "./useLiveKlineSocketData";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

export function useTokenInfo(mint: string) {
  const isFocused = useIsFocused();
  const { getTokenInfo } = poolsService();

  return useQuery<TokenInfo>({
    queryKey: ["tokenInfo", mint],
    queryFn: () => getTokenInfo(mint),
    refetchInterval: isFocused ? 15 * 60 * 1000 : false, // 15分钟刷新一次
    enabled: isFocused && !!mint,
  });
}

export function useShortTokenInfo(mint: string) {
  const isFocused = useIsFocused();
  const { getShortTokenInfo } = poolsService();

  return useQuery<TokenData>({
    queryKey: ["shortTokenInfo", mint],
    queryFn: () => getShortTokenInfo(mint),
    refetchInterval: isFocused ? 15 * 60 * 1000 : false, // 15分钟刷新一次
    enabled: isFocused && !!mint,
  });
}

export function useTokenKlineData(address: string, timeframe: TimeframeKey = "1d") {
  const isFocused = useIsFocused();
  const { getOhlcvData } = poolsService();
  const isLive = timeframe === "live";

  // 只在关键状态变化时记录日志
  const prevStateRef = useRef<{isLive: boolean, isFocused: boolean, timeframe: string} | null>(null);
  const currentState = { isLive, isFocused, timeframe };
  
  if (JSON.stringify(prevStateRef.current) !== JSON.stringify(currentState)) {
    console.log('🔍 useTokenKlineData state changed:', currentState);
    prevStateRef.current = currentState;
  }

  // 使用 useMemo 优化数据合并逻辑
  const [historicalData, setHistoricalData] = useState<number[][]>([]);
  const [socketData, setSocketData] = useState<number[][]>([]);

  // Socket 连接 - 只在 live 模式且页面聚焦时启用
  const liveSocket = useLiveKlineSocketData(address, isFocused && isLive);

  // 历史数据查询 - 优化 enabled 条件，避免不必要的查询
  const {
    data: httpData,
    isLoading: httpLoading,
    error: httpError,
    refetch: refetchHttp,
  } = useQuery<CoinKlineData>({
    queryKey: ["tokenKline", address, timeframe],
    queryFn: () => getOhlcvData(address, timeframe),
    enabled: isFocused && !isLive && !!address,
    refetchInterval: isFocused ? 5 * 60 * 1000 : false,
    staleTime: 5 * 60 * 1000, // 增加到5分钟，与refetchInterval一致
    gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Live 模式的历史数据 - 只在 live 模式时查询
  const {
    data: liveHistoricalData,
    isLoading: liveHistoricalLoading,
    refetch: refetchLiveHistorical,
  } = useQuery<CoinKlineData>({
    queryKey: ["tokenKline-live-initial", address],
    queryFn: () => getOhlcvData(address, "live"),
    enabled: isFocused && isLive && !!address,
    refetchInterval: false, // live 模式不需要自动刷新
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 跟踪查询状态变化，避免重复日志
  const prevQueryStateRef = useRef<{
    httpLoading: boolean;
    liveHistoricalLoading: boolean;
    httpDataLength: number | undefined;
    liveHistoricalDataLength: number | undefined;
    httpError: string | undefined;
  } | null>(null);

  const currentQueryState = {
    httpLoading,
    liveHistoricalLoading,
    httpDataLength: httpData?.ohlcvs?.length,
    liveHistoricalDataLength: liveHistoricalData?.ohlcvs?.length,
    httpError: httpError?.message,
  };

  if (JSON.stringify(prevQueryStateRef.current) !== JSON.stringify(currentQueryState)) {
    console.log('🔍 Query states changed:', currentQueryState);
    prevQueryStateRef.current = currentQueryState;
  }

  // 更新历史数据 - 优化依赖项，避免不必要的执行
  useEffect(() => {
    if (isLive && liveHistoricalData?.ohlcvs) {
      console.log('🔍 Setting live historical data');
      setHistoricalData(liveHistoricalData.ohlcvs);
    } else if (!isLive && httpData?.ohlcvs) {
      console.log('🔍 Setting HTTP data with filtering');
      const filtered = filterByTimeframe(httpData.ohlcvs, timeframe);
      console.log('🔍 Filtered data length:', filtered.length);
      setHistoricalData(filtered);
    }
  }, [isLive, liveHistoricalData?.ohlcvs?.length, httpData?.ohlcvs?.length, timeframe]);

  // 更新 socket 数据 - 只在 live 模式且有数据时更新
  useEffect(() => {
    if (isLive && liveSocket.ohlcvs.length > 0) {
      console.log('🔍 Updating socket data:', { 
        socketDataLength: liveSocket.ohlcvs.length 
      });
      setSocketData(liveSocket.ohlcvs);
    } else if (!isLive) {
      // 非 live 模式时清空 socket 数据
      setSocketData([]);
    }
  }, [isLive, liveSocket.ohlcvs.length]);

  // 合并数据 - 使用 useMemo 优化性能，减少不必要的重新计算
  const mergedData = useMemo(() => {
    if (!isLive) {
      return historicalData;
    }

    if (socketData.length === 0) {
      return historicalData;
    }

    // 智能合并逻辑
    const latestHistorical = historicalData[0];
    const latestSocket = socketData[0];

    if (!latestHistorical || !latestSocket) {
      return [...socketData, ...historicalData];
    }

    const historicalTimestamp = latestHistorical[0];
    const socketTimestamp = latestSocket[0];

    if (socketTimestamp === historicalTimestamp) {
      // 时间戳相同，用 socket 数据更新
      return [latestSocket, ...historicalData.slice(1)];
    } else if (socketTimestamp > historicalTimestamp) {
      // socket 数据更新，添加到前面
      console.log('🔍 Merging new socket data with historical data');
      return [latestSocket, ...historicalData].slice(0, 60); // 限制数据量
    } else {
      // socket 数据过期，忽略
      console.warn('⚠️ 收到过期的K线数据，丢弃', latestSocket);
      return historicalData;
    }
  }, [isLive, historicalData, socketData]);

  // 计算当前价格 - 优化依赖项
  const currentPrice = useMemo(() => {
    if (isLive) {
      return liveSocket.priceUSD || (mergedData[0] ? mergedData[0][4] : 0);
    }
    return liveSocket.priceUSD || httpData?.priceUSD || 0;
  }, [isLive, liveSocket.priceUSD, mergedData, httpData?.priceUSD]);

  // 统一的 refetch 函数 - 使用 useCallback 避免不必要的重新创建
  const refetch = useCallback(() => {
    if (isLive) {
      refetchLiveHistorical();
    } else {
      refetchHttp();
    }
  }, [isLive, refetchLiveHistorical, refetchHttp]);

  const result = {
    data: {
      ohlcvs: mergedData,
      priceUSD: currentPrice,
    },
    isLoading: isLive ? liveHistoricalLoading : httpLoading,
    error: httpError,
    refetch,
    isLive,
  };

  // 只在数据长度或加载状态发生显著变化时记录
  const prevResultRef = useRef<{dataLength: number, isLoading: boolean, priceUSD: string} | null>(null);
  const currentResult = {
    dataLength: result.data.ohlcvs.length,
    isLoading: result.isLoading,
    priceUSD: String(result.data.priceUSD),
  };

  if (JSON.stringify(prevResultRef.current) !== JSON.stringify(currentResult)) {
    console.log('🔍 Final result changed:', currentResult);
    prevResultRef.current = currentResult;
  }

  return result;
}

// 优化的时间框架过滤函数
function filterByTimeframe(ohlcvs: number[][], timeframe: TimeframeKey): number[][] {
  if (!ohlcvs?.length) return [];

  const endTime = ohlcvs[0]?.[0] ?? 0;
  const timeframeSeconds = getTimeframeSeconds(timeframe);
  
  if (timeframeSeconds === 0) return ohlcvs;

  const startTime = endTime - timeframeSeconds;
  const result: number[][] = [];

  for (const item of ohlcvs) {
    if (item[0] >= startTime) {
      result.push(item);
    } else {
      break; // 数据已按时间倒序排列，可以提前退出
    }
  }
  
  // 只在过滤结果与输入数据长度不同时记录
  if (result.length !== ohlcvs.length) {
    console.log('🔍 filterByTimeframe filtered:', { 
      inputLength: ohlcvs.length,
      outputLength: result.length,
      timeframe 
    });
  }
  
  return result;
}

// 提取时间框架计算逻辑
function getTimeframeSeconds(timeframe: TimeframeKey): number {
  const timeframeMap: Record<TimeframeKey, number> = {
    live: 60 * 60,
    "4h": 4 * 60 * 60,
    "1d": 24 * 60 * 60,
    "1w": 7 * 24 * 60 * 60,
    "1m": 30 * 24 * 60 * 60,
    "3m": 3 * 30 * 24 * 60 * 60,
    "1y": 12 * 30 * 24 * 60 * 60,
  };
  
  return timeframeMap[timeframe] || 0;
}