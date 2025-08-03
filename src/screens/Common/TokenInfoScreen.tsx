import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { SkiaRenderer, SkiaChart } from "@wuba/react-native-echarts";
import { Theme } from "../../constants/Theme";
import { RouterName } from "../../constants/navigation";
import { CoinFormatUtil, AddressFormatUtil } from "../../utils/format";
import NumericInputScreen from "./NumericInputScreen";
import { primaryApi, watchlistService } from "../../services";
import TokenIcon from "../../components/TokenIcon";
import * as Clipboard from "expo-clipboard";
import i18n from "../../i18n";
import BottomSheet from "../../components/BottomSheet";
import { Button } from "../../components/Button";
import { FontFamily } from "../../constants/typo";
import { BackIcon, StarOutline, Star, ShareIcon } from "../../constants/icons";
import * as echarts from "echarts/core";
import { Image } from "expo-image";
import {
  mapToUiToken,
  TimeframeKey,
  TIMEFRAMES,
  UserInfoData,
} from "../../types";
import { USDT_MINT } from "../../constants/Crypto";
import { useTokenInfo, useTokenKlineData } from "../../hooks/useTokenInfo";
import { useTokenBalance } from "../../hooks/useBalance";
import { useQueryClient } from "@tanstack/react-query";
import { TOKEN_LIST_KEYS } from "../../hooks/useTokenList";
import { useTokenList } from "../../hooks/useTokenList";
import RebateShareModal from "../../components/Rebate/RebateShareModal";
import { UserStorage } from "../../storage";
import { URL_CONFIG } from "../../constants/url_config";
import {
  GestureHandlerRootView,
  State,
  TapGestureHandler,
} from "react-native-gesture-handler";
import { TimeFormatUtil, openLink } from "../../utils";
import { useToast } from "../../contexts/ToastContext";
import CreateIcon from "../../../assets/tab/create.svg";

echarts.use([SkiaRenderer, LineChart, GridComponent, TooltipComponent]);
const E_HEIGHT = 300;
const E_WIDTH = Dimensions.get("window").width;

// 通用的图表配置
const COMMON_CHART_CONFIG = {
  tooltip: {
    trigger: "axis",
    formatter: (params: any) => {
      const value = params?.[0]?.value;

      if (!value || !Array.isArray(value) || value.length < 5) {
        return "";
      }

      const date = new Date(value[0] * 1000);
      const formattedPrice = CoinFormatUtil.formatPrice(value[4]);
      return `${date.toLocaleString()}\n$${formattedPrice}`;
    },
    hideDelay: 2000,
    position: function (
      pos: any,
      params: any,
      el: any,
      elRect: any,
      size: any
    ) {
      const [x] = pos;
      const tooltipWidth = 300;
      const chartWidth = size.viewSize[0];

      if (x < tooltipWidth / 2) {
        return [0, 0];
      }
      if (x > chartWidth - tooltipWidth / 2) {
        return [chartWidth - tooltipWidth / 2, 0];
      }
      return [x - tooltipWidth / 2, 0];
    },
    textStyle: {
      color: Theme.secondaryColors[900],
    },
  },
  grid: {
    top: 60,
    bottom: 20,
    left: 0,
    right: 0,
  },
  xAxis: {
    type: "time",
    show: false,
  },
  yAxis: {
    type: "value",
    show: false,
    scale: true,
  },
};

// 时间框架配置
const TIMEFRAME_CONFIG = {
  live: { label: "tokenInfo.timeframe.pastHour", maxDays: 1 },
  "4h": { label: "tokenInfo.timeframe.past4Hours", maxDays: 1 },
  "1d": { label: "tokenInfo.timeframe.pastDay", maxDays: 7 },
  "1w": { label: "tokenInfo.timeframe.pastWeek", maxDays: 30 },
  "1m": { label: "tokenInfo.timeframe.pastMonth", maxDays: 90 },
  "3m": { label: "tokenInfo.timeframe.past3Months", maxDays: 180 },
  "1y": { label: "tokenInfo.timeframe.pastYear", maxDays: 365 },
} as const;

// 获取时间框架标签
const getTimeframeLabel = (key: keyof typeof TIMEFRAME_CONFIG) =>
  i18n.t(TIMEFRAME_CONFIG[key].label);

// 社交链接配置
const SOCIAL_LINKS = [
  { key: "website", icon: "globe-outline" },
  { key: "tiktok", icon: "logo-tiktok" },
  { key: "twitter", icon: "logo-twitter" },
  { key: "discord", icon: "logo-discord" },
  { key: "telegram", icon: "paper-plane-outline" },
].map((link) => ({
  ...link,
  field: link.key,
  getUrl: (info: any) => info?.[link.key] || null,
  shouldShow: (info: any) => !!info?.[link.key],
}));

// 统一的图表组件，包含价格显示和K线图表
const TokenChartWithPrice = ({
  token,
  chartMenuTabInfo,
  scrollViewRef,
}: {
  token: any;
  chartMenuTabInfo: TimeframeKey[];
  scrollViewRef: any;
}) => {
  const skiaRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);
  const prevDataRef = useRef<any>(null);
  const prevTrendColorRef = useRef<string>("");
  const [activeBtn, setActiveBtn] = useState<TimeframeKey>("1d");

  // 在组件内部获取K线数据
  const {
    data: klineData,
    isLoading: klineLoading,
    refetch: refetchKline,
    error: klineError,
  } = useTokenKlineData(token.mint, activeBtn);

  // 时间框架切换逻辑
  useEffect(() => {
    if (!chartMenuTabInfo.length) return;

    // 只有当当前选中的时间框架不在可用列表中时，才切换到第一个
    if (!chartMenuTabInfo.includes(activeBtn)) {
      setActiveBtn(chartMenuTabInfo[0] as TimeframeKey);
    }
  }, [chartMenuTabInfo, activeBtn]);

  // 计算涨跌幅
  const currentChange = useMemo(() => {
    const klineValues = klineData?.ohlcvs || [];
    if (klineValues.length < 2) return 0;
    const endPrice = klineValues[0]?.[4] || 0;
    const startPrice = klineValues[klineValues.length - 1]?.[4] || 0;
    console.log("startPrice", startPrice, "endPrice", endPrice);
    return ((endPrice - startPrice) / startPrice) * 100;
  }, [klineData?.ohlcvs]);

  // 计算趋势颜色
  const trendColor = useMemo(
    () => (currentChange > 0 ? Theme.ascend : Theme.descend),
    [currentChange]
  );

  // 获取当前价格
  const currentPrice = useMemo(() => {
    return klineData?.priceUSD || token?.quoteTokenPriceUsd || 0;
  }, [klineData?.priceUSD, token?.quoteTokenPriceUsd]);

  // 计算当前时间框架的高低点
  const priceRange = useMemo(() => {
    const klineValues = klineData?.ohlcvs || [];
    if (klineValues.length === 0) return { high: 0, low: 0 };

    const prices = klineValues.map((item: number[]) => item[4]);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }, [klineData?.ohlcvs]);

  // 时间框架映射
  const TIMEFRAME_MAP = useMemo(
    () =>
      Object.keys(TIMEFRAME_CONFIG).reduce(
        (acc, key) => ({
          ...acc,
          [key]: getTimeframeLabel(key as keyof typeof TIMEFRAME_CONFIG),
        }),
        {} as Record<string, string>
      ),
    []
  );

  // 完整的图表配置
  const fullOption = useMemo(
    () => ({
      ...COMMON_CHART_CONFIG,
      series: [
        {
          type: "line",
          smooth: true,
          symbol: "none",
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: `rgba(${currentChange > 0 ? "86, 190, 100" : "220, 63, 115"}, 0.3)`,
              },
              {
                offset: 1,
                color: `rgba(${currentChange > 0 ? "86, 190, 100" : "220, 63, 115"}, 0)`,
              },
            ]),
          },
          itemStyle: {
            color: trendColor,
          },
          data: klineData?.ohlcvs || [],
        },
      ],
    }),
    [klineData?.ohlcvs?.length, currentChange, trendColor]
  );

  // 初始化图表
  useEffect(() => {
    if (!skiaRef.current) return;

    const chart = echarts.init(skiaRef.current, "light", {
      renderer: "canvas",
      width: E_WIDTH,
      height: E_HEIGHT,
    });

    chartInstanceRef.current = chart;

    // 设置初始配置
    if (klineData?.ohlcvs?.length > 0) {
      chart.setOption(fullOption);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // 更新图表数据
  useEffect(() => {
    if (!chartInstanceRef.current || !klineData?.ohlcvs?.length) return;

    // 检查数据是否真的发生变化
    const currentData = JSON.stringify(klineData.ohlcvs);
    const currentTrendColor = trendColor;

    if (
      currentData === prevDataRef.current &&
      currentTrendColor === prevTrendColorRef.current
    ) {
      return; // 数据和颜色都没有变化，不需要更新
    }

    prevDataRef.current = currentData;
    prevTrendColorRef.current = currentTrendColor;

    // 使用 setTimeout 确保在下一个事件循环中更新
    const updateChart = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.setOption(fullOption, {
          notMerge: true,
        });
      }
    };

    setTimeout(updateChart, 0);
  }, [fullOption]);

  // 添加新的 effect 来处理图表实例的重新创建
  useEffect(() => {
    if (!skiaRef.current || !klineData?.ohlcvs?.length) return;

    // 如果图表实例不存在，重新创建
    if (!chartInstanceRef.current) {
      const chart = echarts.init(skiaRef.current, "light", {
        renderer: "canvas",
        width: E_WIDTH,
        height: E_HEIGHT,
      });

      chartInstanceRef.current = chart;

      // 使用 setTimeout 延迟设置选项
      setTimeout(() => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.setOption(fullOption);
        }
      }, 0);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [klineData?.ohlcvs?.length]);

  // 添加组件卸载时的清理
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // 优化手势处理函数
  const onHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    } else if (event.nativeEvent.state === State.END) {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    } else {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    }
  }, []);

  // 优化时间框架按钮渲染
  const renderTimeframeButtons = useCallback(
    () => (
      <View style={styles.buttonContainer}>
        {chartMenuTabInfo.map((label: TimeframeKey) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.chartBtn,
              activeBtn === label && styles.activeChartBtn,
            ]}
            onPress={() => setActiveBtn(label)}
          >
            <Text
              style={[
                styles.chartBtnText,
                activeBtn === label && styles.activeChartBtnText,
              ]}
            >
              {label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [chartMenuTabInfo.length, activeBtn]
  );

  return (
    <>
      {/* 价格显示区域 */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          ${CoinFormatUtil.formatPrice(currentPrice)}
        </Text>
        {token.priceChangePercentage !== undefined && (
          <>
            <View style={styles.changeContainer}>
              <Ionicons
                name={currentChange > 0 ? "caret-up" : "caret-down"}
                size={16}
                color={trendColor}
              />
              <Text style={[styles.change, { color: trendColor }]}>
                {CoinFormatUtil.formatPercentageWithSign(currentChange)}
              </Text>
              <Text style={[styles.past, { marginLeft: 8 }]}>
                {TIMEFRAME_MAP[activeBtn]}
              </Text>
            </View>
            <Text style={styles.past}>
              ${CoinFormatUtil.formatPrice(priceRange.low)} - $
              {CoinFormatUtil.formatPrice(priceRange.high)}
            </Text>
          </>
        )}
      </View>

      {/* 图表区域 */}
      <View
        style={[
          styles.chartContainer,
          { pointerEvents: klineLoading ? "none" : "auto" },
        ]}
      >
        {klineLoading && !klineData?.ohlcvs ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{i18n.t("common.loading")}</Text>
          </View>
        ) : (
          <TapGestureHandler onHandlerStateChange={onHandlerStateChange}>
            <View style={styles.chart}>
              <SkiaChart ref={skiaRef} style={styles.chart} />
            </View>
          </TapGestureHandler>
        )}
      </View>

      {/* 时间框架按钮 */}
      {renderTimeframeButtons()}

      {/* 错误状态显示 */}
      {klineError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {i18n.t("common.error")}: {klineError?.message || "Unknown error"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchKline()}
          >
            <Text style={styles.retryButtonText}>{i18n.t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// 将组件本身导出
export const TokenInfoScreen = ({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) => {
  const { showToast } = useToast();
  const token = route.params.token;
  // 获取 watchlist 数据
  const { data: watchlistData } = useTokenList("watchlist");

  // 使用 React Query 钩子获取数据
  const {
    data: tokenInfo,
    isLoading: tokenInfoLoading,
    refetch: refetchTokenInfo,
  } = useTokenInfo(token.mint);
  const {
    tokenBalance,
    loading: balanceLoading,
    refetch: refetchBalance,
  } = useTokenBalance(token.mint);
  const [visible, setVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  // watchlist相关状态
  const [isWatchlisted, setIsWatchlisted] = useState<boolean | undefined>(
    undefined
  );
  const scaleAnim = useRef(new Animated.Value(1)).current; // 添加动画值
  const [isLoading, setIsLoading] = useState(false); // 添加动画状态
  const scrollViewRef = useRef<any>(null);
  // 添加紧凑导航栏状态
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  // 交易相关状态
  const [tradeParams, setTradeParams] = useState<{
    mode: "buy" | "sell";
    inputMint: string;
    outputMint: string;
    isVisible: boolean;
  }>({
    mode: "buy",
    inputMint: "",
    outputMint: "",
    isVisible: false,
  });

  // 添加状态来跟踪复制操作
  const [copied, setCopied] = useState<boolean>(false);

  // 处理滚动事件，显示/隐藏紧凑导航栏
  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShowCompact = scrollY > 100; // 当滚动超过200px时显示紧凑导航栏
    setShowCompactHeader(shouldShowCompact);
  }, []);

  // 设置交易模式时同时设置代币和显示状态 - 使用 useCallback 优化性能
  const handleSetMode = useCallback(
    (mode: "buy" | "sell") => {
      setTradeParams({
        mode,
        inputMint: mode === "buy" ? USDT_MINT : token.mint,
        outputMint: mode === "buy" ? token.mint : USDT_MINT,
        isVisible: true,
      });
    },
    [token.mint]
  );

  // 关闭时更新状态 - 使用 useCallback 优化性能
  const handleClose = useCallback(() => {
    setTradeParams((prev) => ({ ...prev, isVisible: false }));
    // 关闭交易界面后刷新数据
  }, []); // 空依赖项，因为不依赖任何外部变量

  // 定义其他指标数据数组 - 使用 useMemo 优化性能
  const metrics = useMemo(() => {
    const baseMetrics = [
      {
        key: "marketCap",
        value: tokenInfo?.token.marketCapUSD || tokenInfo?.token.fdvUsd,
        prefix: "$",
      },
      {
        key: "volume",
        value: tokenInfo?.token.volumeUSDH24 || 0,
        prefix: "$",
      },
      {
        key: "holders",
        value: tokenInfo?.token.holdings || 0,
      },
      {
        key: "supply",
        value: tokenInfo?.token?.circulatingSupply || 0,
      },
    ].map(({ key, value, prefix = "" }) => ({
      label: i18n.t(`tokenInfo.metrics.${key}`),
      value: CoinFormatUtil.formatAmount(Number(value), prefix),
    }));

    // 如果有创建时间，添加到指标列表末尾
    if (tokenInfo?.token.createdTime) {
      baseMetrics.push({
        label: i18n.t("tokenInfo.metrics.createdAt"),
        value: TimeFormatUtil.formatTimeAgo(tokenInfo.token.createdTime),
      });
    }

    return baseMetrics;
  }, [tokenInfo?.token]); // 简化依赖项，只依赖整个token对象

  // 处理复制的函数 - 使用 useCallback 优化性能
  const handleCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, []); // 空依赖项，因为不依赖任何外部变量

  // 从 watchlist 数据中检查当前代币是否在收藏列表中
  const checkWatchlistStatus = () => {
    const isInWatchlist = watchlistData?.pages.some((page) =>
      page.some((item) => item.mint === token.mint)
    );
    setIsWatchlisted(!!isInWatchlist);
  };

  useEffect(() => {
    checkWatchlistStatus();
  }, [watchlistData, token.mint]);

  const queryClient = useQueryClient();

  const handleToggleWatchlist = useCallback(async () => {
    const newWatchlistState = !isWatchlisted;
    try {
      // 1. 立即更新UI状态
      setIsWatchlisted(newWatchlistState);

      // 3. API请求
      if (newWatchlistState) {
        await watchlistService.addToWatchlist(token.mint);
      } else {
        await watchlistService.removeFromWatchlist(token.mint);
      }

      // 4. 使 watchlist 查询失效，触发重新获取
      queryClient.invalidateQueries({
        queryKey: TOKEN_LIST_KEYS.watchlist,
      });
    } catch (error) {
      setIsWatchlisted(!newWatchlistState);
      console.error("Error toggling watchlist:", error);
    }
  }, [isWatchlisted, token.mint, queryClient]);

  // 添加刷新函数
  const onRefresh = useCallback(async () => {
    setIsLoading(true);
    // 并行刷新所有数据
    await Promise.all([refetchTokenInfo(), refetchBalance()]);
    console.log("刷新完成");
    setIsLoading(false);
  }, [refetchTokenInfo, refetchBalance]);

  const handleStore = useCallback(() => {
    setVisible(true);
  }, []); // 空依赖项，因为不依赖任何外部变量

  useEffect(() => {
    const loadUserInfo = async () => {
      // 先从本地获取用户信息
      const cachedUserInfo = await UserStorage.getUserInfo();
      if (cachedUserInfo) {
        setUserInfo(cachedUserInfo);
      }
    };
    loadUserInfo();
  }, []);

  const [chartMenuTabInfo, setChartMenuTabInfo] = useState<any>(TIMEFRAMES);

  // 优化时间框架切换逻辑，减少不必要的计算
  useEffect(() => {
    if (!tokenInfo?.token?.createdTime) return;

    const createdTime = new Date(tokenInfo.token.createdTime).getTime();
    const now = Date.now();
    const daysDiff = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));

    const availableTimeframes = Object.entries(TIMEFRAME_CONFIG)
      .filter(([_, config]) => daysDiff >= config.maxDays)
      .map(([key]) => key);

    setChartMenuTabInfo(availableTimeframes);
  }, [tokenInfo?.token?.createdTime]); // 移除 activeBtn 依赖项，避免循环

  const handleCreate = useCallback(() => {
    console.log(tokenInfo?.token, token);
    if (tokenInfo?.token?.attributes?.chain && tokenInfo?.token?.attributes?.address) {
      navigation.navigate(RouterName.CREATE_POST, {
        token: mapToUiToken(tokenInfo?.token || token),
      });
    } else {
      navigation.navigate(RouterName.CREATE_POST, {
        token: token,
      });
    }
  }, [tokenInfo?.token?.mint, token.mint, navigation]); // 只依赖必要的属性

  return (
    <SafeAreaView style={styles.container}>
      {/* 统一的导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        {showCompactHeader && (
          <View style={styles.compactTokenInfo}>
            <TokenIcon icon={token.icon} size={24} />
            <Text style={styles.compactTokenName} numberOfLines={1}>
              {token.symbol}
            </Text>
          </View>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleWatchlist}
          >
            {isWatchlisted ? (
              <Star width={24} height={24} />
            ) : (
              <StarOutline width={24} height={24} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStore} style={styles.iconButton}>
            <ShareIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>

      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={Theme.text[300]}
              colors={[Theme.text[300]]}
            />
          }
        >
          <View style={styles.tokenContainer}>
            <TokenIcon icon={token.icon} size={40} />
            <View style={styles.tokenNameContainer}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {token.name}
              </Text>
              <Text style={styles.symbol}>{token.symbol}</Text>
            </View>
          </View>

          <TokenChartWithPrice
            token={token}
            chartMenuTabInfo={chartMenuTabInfo}
            scrollViewRef={scrollViewRef}
          />

          <View style={styles.balanceContainer}>
            <Text style={styles.sectionTitle}>
              {i18n.t("tokenInfo.balance.yourBalance")}
            </Text>

            {/* 价值卡片 */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>
                  {i18n.t("tokenInfo.balance.value")}
                </Text>
                <Text style={styles.balanceValue}>
                  ${CoinFormatUtil.formatPrice(tokenBalance?.balance_usd || 0)}
                </Text>
              </View>

              <Image
                source={require("../../../assets/info/cube-icon-1.png")}
                style={styles.cubeIcon}
                contentFit="contain"
              />
            </View>

            <Text style={styles.sectionTitle}>{i18n.t("common.about")}</Text>
            {tokenInfo?.token.attributes.description &&
              tokenInfo.token.attributes.description !== "none" && (
                <View style={styles.aboutSection}>
                  <Text style={styles.aboutText}>
                    {tokenInfo.token.attributes.description}
                  </Text>
                </View>
              )}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>
                {i18n.t("tokenInfo.metrics.address")}
              </Text>
              <TouchableOpacity
                style={styles.metricValueContainer}
                onPress={() => handleCopy(token.mint)}
              >
                <Text style={[styles.metricLabel, { color: Theme.text[300] }]}>
                  {AddressFormatUtil.formatAddress(token.mint)}
                </Text>
                <Ionicons
                  name={copied ? "checkmark-circle-outline" : "copy-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={[styles.metricLabel, { color: Theme.text[300] }]}>
                  {metric.value}
                </Text>
              </View>
            ))}

            {/* 在指标列表后添加社交链接行 */}
            {SOCIAL_LINKS.some((link) =>
              link.shouldShow(tokenInfo?.token.attributes)
            ) && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>
                  {i18n.t("tokenInfo.metrics.socialLinks")}
                </Text>
                <View style={styles.socialLinks}>
                  {SOCIAL_LINKS.map(
                    (link) =>
                      link.shouldShow(tokenInfo?.token.attributes) && (
                        <TouchableOpacity
                          key={link.key}
                          style={styles.socialButton}
                          onPress={async () => {
                            const url = link.getUrl(
                              tokenInfo?.token.attributes
                            );
                            if (url) {
                              if (!(await openLink(url))) {
                                showToast(
                                  "success",
                                  {
                                    message: i18n.t("tokenInfo.social.copied"),
                                    yPosition: "10%",
                                  },
                                  2000,
                                  "simple"
                                );
                              }
                            }
                          }}
                        >
                          <Ionicons
                            name={link.icon as any}
                            size={20}
                            color="black"
                          />
                        </TouchableOpacity>
                      )
                  )}
                </View>
              </View>
            )}

            {/* 免责声明 */}
            <Text style={styles.disclaimer}>
              {i18n.t("tokenInfo.disclaimer")}
            </Text>
          </View>
        </ScrollView>
      </GestureHandlerRootView>

      {/* 底部按钮区域 */}
      {(tokenBalance?.balance_token?.ui_amount || 0) > 0 ? (
        // 有余额时显示两个按钮
        <View style={styles.bottomButtonContainer}>
          <Button
            type="outline"
            style={styles.button}
            onPress={() => handleSetMode("sell")}
          >
            {i18n.t("modes.sell")}
          </Button>

          <Button
            type="primary"
            style={styles.button}
            onPress={() => handleSetMode("buy")}
          >
            {i18n.t("modes.buy")}
          </Button>
          <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
            <CreateIcon width={24} height={24} color={Theme.text[300]} />
            <Text style={styles.createText}>{i18n.t("modes.create")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // 没有余额时只显示购买按钮
        <View style={styles.bottomButtonContainer}>
          <Button
            type="primary"
            style={styles.fullWidthButton}
            onPress={() => handleSetMode("buy")}
          >
            {i18n.t("modes.buy")}
          </Button>
          <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
            <CreateIcon width={24} height={24} color={Theme.text[300]} />
            <Text style={styles.createText}>{i18n.t("modes.create")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 使用BottomSheet替代Modal */}
      <BottomSheet
        isVisible={tradeParams.isVisible}
        onClose={handleClose}
        disableGestures={true}
        height="90%"
      >
        <NumericInputScreen
          chain={token.chain}
          mode={tradeParams.mode}
          inputMint={tradeParams.inputMint}
          outputMint={tradeParams.outputMint}
          onClose={handleClose}
          postId={route.params.postId}
        />
      </BottomSheet>
      <RebateShareModal
        data={{
          inviteCode: userInfo?.invitationCode ?? "",
          inviteLink: URL_CONFIG.WEBSITE_URL,
          userName: userInfo?.nickname ?? "",
          userAvatar: userInfo?.avatar,
          bgType: 1,
        }}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </SafeAreaView>
  );
};

// 导出样式
export const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerRight: {
    flexDirection: "row",
    gap: 16,
  },
  tokenContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  tokenNameContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  symbol: {
    fontSize: 11,
    color: Theme.text[100],
    fontFamily: FontFamily.semiBold,
  },
  priceContainer: {
    paddingHorizontal: 16,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  price: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
  },
  change: {
    fontSize: 14,
  },
  past: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  chartContainer: {
    height: E_HEIGHT,
    width: "100%",
    backgroundColor: "white",
  },
  chart: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  chartBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  activeChartBtn: {
    backgroundColor: "#000",
  },
  chartBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[100],
  },
  activeChartBtnText: {
    color: "#FFF",
  },
  iconButton: {
    padding: 4,
  },
  balanceContainer: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 12,
    color: Theme.text[200],
    fontWeight: "600",
    marginTop: 16,
  },
  balanceCard: {
    backgroundColor: Theme.background[100],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: Theme.textColors[300],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 0,
    height: 70,
  },
  balanceRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    margin: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  cubeIcon: {
    width: 154,
    height: 70,
    marginRight: 16,
  },
  aboutSection: {
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: Theme.text[100],
    fontWeight: "500",
    fontFamily: FontFamily.medium,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  socialLinks: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 16,
  },
  button: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
  createButton: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  createText: {
    fontSize: 12,
    color: Theme.textColors[300],
    fontFamily: FontFamily.semiBold,
  },
  disclaimer: {
    fontSize: 10,
    color: Theme.text[50],
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 16,
    fontFamily: FontFamily.regular,
  },
  embeddedContainer: {
    backgroundColor: "transparent",
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: Theme.background[100],
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
  },
  retryButton: {
    padding: 8,
    backgroundColor: Theme.textColors[300],
    borderRadius: 4,
  },
  retryButtonText: {
    fontSize: 12,
    color: Theme.text[100],
    fontFamily: FontFamily.semiBold,
  },
  compactTokenInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 16,
  },
  compactTokenName: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
});

// 导出路由包装后的组件
export default TokenInfoScreen;
