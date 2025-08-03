// src/components/NumericInputScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { FontFamily } from "../../constants/typo";
import NumberKeyboard from "../../components/NumberKeyboard";
import { CloseIcon, SettingIcon } from "../../constants/icons";
import TokenIcon from "../../components/TokenIcon";
import SlippageSettings, {
  SlippageSettings as SlippageSettingsType,
} from "../../components/SlippageSettings";
import Slider, { SliderRef } from "../../components/Slider";
import { eventBus, Trade } from "../../services/config/eventBus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SLIPPAGE_SETTINGS_KEY } from "../../components/SlippageSettings";
import { useShortTokenInfo } from "../../hooks/useTokenInfo";
import { useTokenBalance } from "../../hooks/useBalance";
import { swapService } from "../../services/trading/swap";
import i18n from "../../i18n";
import { CoinFormatUtil } from "../../utils/format";
import ErrorBottomSheet, { ErrorMessage } from "../../components/ErrorBottomSheet";
import { AppLaunchManagerService, ThresholdResult } from '../../services';

type NumericInputScreenProps = {
  chain: string;
  inputMint: string; // 输入代币的 mint 地址
  outputMint: string; // 输出代币的 mint 地址
  mode: "buy" | "sell"; // 买卖模式
  onClose?: () => void;
  postId?: string;
};

const NumericInputScreen: React.FC<NumericInputScreenProps> = ({
  chain,
  inputMint,
  outputMint,
  mode,
  onClose,
  postId,
}) => {
  // 使用 React Query 钩子获取代币信息
  const { data: inputTokenInfo, isLoading: inputLoading } =
    useShortTokenInfo(inputMint);
  const { data: outputTokenInfo, isLoading: outputLoading } =
    useShortTokenInfo(outputMint);
  const { tokenBalance: inputBalance, loading: balanceLoading } =
    useTokenBalance(inputMint);

  const [swapAmount, setSwapAmount] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState<number>(0);
  const [quotePayload, setQuotePayload] = useState("");
  const [fees, setFees] = useState({ tradingFee: 0, ataFee: 0 });
  const [showSlippage, setShowSlippage] = useState(false);
  const [slippageSettings, setSlippageSettings] =
    useState<SlippageSettingsType>({
      value: 20,
      isAuto: true,
    });
  const decimals = 4;
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdResult | null>(null);

  const { getQuote: getQuoteService } = swapService();
  const sliderRef = useRef<SliderRef>(null);

  // 计算总的加载状态
  const isLoading = inputLoading || outputLoading || balanceLoading;

  // 获取输入代币的小数位数
  const inputDecimals = inputTokenInfo?.attributes?.decimals || 6;
  const outputDecimals = outputTokenInfo?.attributes?.decimals || 6;

  // 加载本地存储的滑点设置
  useEffect(() => {
    const loadSlippageSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(SLIPPAGE_SETTINGS_KEY);
        if (savedSettings) {
          setSlippageSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error("Failed to load slippage settings:", error);
      }
    };

    loadSlippageSettings();
  }, []);

    // 在组件加载时获取阈值
    useEffect(() => {
      const fetchThresholds = async () => {
        const result = await AppLaunchManagerService.getThresholds(mode);
        setThresholds(result);
      };
    
      fetchThresholds();
    }, [mode]);

  // 获取报价
  const getQuote = async (value: string) => {
    if (!value || Number(value) === 0 || !thresholds) {
      setOutputAmount(prev => prev = 0);
      setFees({ tradingFee: 0, ataFee: 0 });
      setIsValid(false);
      return;
    }

    try {
      console.log("slippageSettings when getQuote: ", slippageSettings);
      console.log("value when getQuote: ", value);
      const amount = Number(value) * Math.pow(10, inputDecimals);
      const quote = await getQuoteService(
        mode,
        chain,
        mode === "buy" ? outputMint : inputMint,
        amount.toFixed(0),
        slippageSettings.isAuto ? undefined : slippageSettings.value * 100,
        slippageSettings.isAuto,
        postId
      );

      const outAmount = Number(quote.outAmount) / Math.pow(10, outputDecimals);
      setOutputAmount(outAmount);
      setQuotePayload(quote.payload);
      setFees({
        tradingFee: (Number(quote.tradingFee)+Number(quote.gasFee)) / 1e6,
        ataFee: Number(quote.ataFee) / 1e6,
      });

      // 更新有效性状态
      const inputValue = Number(value);
      const balance = inputBalance?.balance_token?.ui_amount ?? 0;
      const usdValue = mode === "buy" ? inputValue : outAmount;
      setIsValid(inputValue <= balance && usdValue >= thresholds.minAmount);
    } catch (error) {
      console.error("Failed to get quote:", error);
      setIsValid(false);
    }
  };

  // 轮询逻辑
  useEffect(() => {
    getQuote(swapAmount);

    if (swapAmount) {
      // 只有有值的时候才设置轮询
      const timer = setInterval(() => {
        getQuote(swapAmount);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [swapAmount, slippageSettings]); // 依赖 inputAmount 和 slippageSettings

  // 处理滑点设置保存
  const handleSlippageSave = (settings: SlippageSettingsType) => {
    console.log("slippageSettings when handleSlippageSave: ", settings);
    setSlippageSettings(settings);
    setShowSlippage(false);
  };

  // 处理数字输入
  const handleNumberPress = (num: string) => {
    if (num === "⌫") {
      setInputAmount((prev) => prev.slice(0, -1));
      setSwapAmount((prev) => prev.slice(0, -1));
      return;
    }

    const newValue = inputAmount + num;
    const pattern = /^\d*\.?\d{0,4}$/;

    if (pattern.test(newValue)) {
      setInputAmount(newValue);
      setSwapAmount(newValue);
    }
  };

  // 处理快捷金额选择
  const handleQuickAmountPress = (value: string) => {
    if (isLoading) return;

    const balance = inputBalance?.balance_token?.ui_amount || 0;
    let amount: number;

    switch (value) {
      case "25%":
        amount = balance * 0.25;
        break;
      case "50%":
        amount = balance * 0.5;
        break;
      case "75%":
        amount = balance * 0.75;
        break;
      case "MAX":
        amount = balance;
        break;
      default:
        return;
    }

    const amountStr =
      value === "MAX" ? amount.toString() : amount.toFixed(decimals);
    setInputAmount(CoinFormatUtil.formatTokenQuantity(amount));
    setSwapAmount(amountStr);
  };

  // 验证交易
  const validateTrade = () => {
    if (!isValid) {
      const inputValue = Number(swapAmount);
      const balance = inputBalance?.balance_token?.ui_amount ?? 0;

      if (inputValue > balance) {
        setErrorMessage({
          title: i18n.t("tradeError.insufficientBalance"),
          message: i18n.t("tradeError.pleaseCheckYourInput"),
        });
        return false;
      }

      const usdValue = mode === "buy" ? inputValue : outputAmount;
      if (usdValue < thresholds!.minAmount) {
        setErrorMessage({
          title: i18n.t("tradeError.tooSmall"),
          message: i18n.t("tradeError.minAmount", {mode: i18n.t(`modes.${mode}`), amount: thresholds!.minAmount}),
        });
        return false;
      }
    }
    return isValid;
  };

  // 处理滑动完成
  const handleSwipeComplete = async () => {
    try {
      if (!isValid) return;
      const tokenInfo =
        mode === "buy"
          ? {
              id: Date.now().toString(),
              status: 0,
              mode: 0,
              symbol: outputTokenInfo?.token?.attributes?.symbol ?? "",
              token: outputMint,
              amountUsd: Number(inputAmount),
              amount: Number(outputAmount),
              payload: quotePayload,
            }
          : {
              id: Date.now().toString(),
              status: 0,
              mode: 1,
              symbol: inputTokenInfo?.token?.attributes?.symbol ?? "",
              token: inputMint,
              amountUsd: Number(outputAmount),
              amount: Number(inputAmount),
              payload: quotePayload,
            };
      // 发送交易到后台处理
      eventBus.emit("TRADE_NEW", tokenInfo as Trade);
      onClose?.();
      return true;
    } catch (error) {
      console.error("Swap failed:", error);
      sliderRef.current?.reset();
      return false;
    }
  };

  const handleSettingPress = () => {
    setShowSlippage(true);
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSettingPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SettingIcon />
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t(`modes.${mode}`)}</Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseIcon />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Token Info */}
        <View style={styles.tokenInfo}>
          <TokenIcon
            icon={inputTokenInfo?.token?.attributes?.image}
            size={24}
          />
          <Text style={styles.tokenAmount}>
            {inputTokenInfo?.token?.attributes?.symbol}:{" "}
            {mode === "buy" ? "$" : ""}
            {CoinFormatUtil.formatTokenQuantity(inputBalance?.balance_token?.ui_amount)}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amountText,
              !inputAmount && { color: Theme.text[100] },
            ]} 
          >
            {mode === "buy" ? "$" : ""}
            {inputAmount || Number(0).toFixed(decimals)}
          </Text>
          <Text style={styles.tokenValue}>
            ≈ {mode === "sell" ? "$" : ""}
            {Number(outputAmount).toFixed(decimals)}{" "}
            {mode === "buy" && outputTokenInfo?.token?.attributes?.symbol}
          </Text>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickButtons}>
          {["25%", "50%", "75%", "MAX"].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.quickButton, isLoading && styles.disabledButton]}
              onPress={() => handleQuickAmountPress(value)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.quickButtonText,
                  isLoading && styles.disabledText,
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fee Info */}
        <View style={styles.feeInfo}>
          <Text style={styles.feeText}>
            {i18n.t("feeInfo.feeAndGas")}≈ ${" "}
            {fees.tradingFee.toFixed(4)}
          </Text>
          {fees.ataFee > 0 && (
            <Text style={styles.feeText}>
              {i18n.t("feeInfo.ataFee")}≈ $ {fees.ataFee.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Number Keyboard */}
        <NumberKeyboard
          onNumberPress={handleNumberPress}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
      {/* Slider */}
      <Slider
        ref={sliderRef}
        title={`${i18n.t('common.swipe')}${i18n.t(`modes.${mode}`)}`}
        disabled={!isValid || isLoading}
        onSwipeComplete={handleSwipeComplete}
        onTouchStart={validateTrade}
        height={58}
      />
      {/* 最小交易额提示 */}
      <Text style={styles.minAmountTip}>
        {thresholds && i18n.t("tradeError.minAmount", {mode: i18n.t(`modes.${mode}`), amount: thresholds.minAmount})}
      </Text>

      <View style={{ marginTop: 10 }} />
      {/* Slippage Settings */}
      <SlippageSettings
        isVisible={showSlippage}
        initialSettings={slippageSettings}
        onSave={handleSlippageSave}
        onClose={() => setShowSlippage(false)}
      />
      <ErrorBottomSheet
        errorMessage={errorMessage}
        onClose={() => setErrorMessage(null)}
        visible={!!errorMessage}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 26,
    backgroundColor: Theme.background[100],
    alignSelf: "center",
  },
  tokenAmount: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  amountText: {
    fontSize: 48,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  tokenValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[100],
  },
  quickButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
    gap: 8,
  },
  quickButton: {
    height: 32,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Theme.background[100],
  },
  quickButtonText: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  feeInfo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  feeText: {
    fontSize: 12,
    color: Theme.text[100],
    textAlign: "center",
    fontFamily: FontFamily.regular,
  },
  disabledButton: {
    color: Theme.text[50],
    backgroundColor: Theme.background[50],
  },
  disabledText: {
    color: Theme.text[50],
  },
  minAmountTip: {
    fontSize: 12,
    color: Theme.text[100],
    textAlign: "center",
    marginTop: 8,
    fontFamily: FontFamily.regular,
    marginBottom: 40
  },
});

export default NumericInputScreen;
