import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { FontFamily } from "../../constants/typo";
import AppBar from "../../components/AppBar";
import i18n from "../../i18n";
import TokenIcon from "../../components/TokenIcon";
import {
  SolanaIcon,
  ScanIcon,
  AddressTableIcon,
} from "../../constants/icons";
import { Button } from "../../components/Button";
import ErrorBottomSheet, { ErrorMessage } from "../../components/ErrorBottomSheet";
import { swapService } from "../../services/trading/swap";
import CashoutConfirm from "../../components/CashoutConfirm";
import { useTokenBalance } from "../../hooks/useBalance";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { CoinFormatUtil } from "../../utils/format";
import BottomSheet from "../../components/BottomSheet";
import { TokenBalanceData } from "../../types";
import { AppLaunchManagerService, ThresholdResult } from "../../services";
import { USDT_MINT } from "../../constants/Crypto";


const CashoutScreen = ({ navigation, route }: any) => {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [isUsdtValid, setIsUsdtValid] = useState(false);
  const [fees, setFees] = useState({ tradingFee: 0, ataFee: 0 });
  const { token } = route.params || {token: null};
  const { getWithdrawFee } = swapService();
  const [showConfirm, setShowConfirm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("0");
  const [showError, setShowError] = useState(false);
  const [usdtAmount, setUsdtAmount] = useState(0);
  const [thresholds, setThresholds] = useState<ThresholdResult | null>(null);

  // 在组件加载时获取阈值
  useEffect(() => {
    const fetchThresholds = async () => {
      const result = await AppLaunchManagerService.getThresholds('withdraw');
      setThresholds(result);
    };
  
    fetchThresholds();
  }, []);

  // 使用 hooks 获取余额
  const { tokenBalance: usdtBalance } = useTokenBalance(USDT_MINT);
  const { tokenBalance } = useTokenBalance(token.attributes.address);
  const decimals = 4;
  const [amountUsd, setAmountUsd] = useState(0);

  const getFees = async () => {
    // 如果金额无效或地址无效，重置费用
    if (!withdrawAmount || !isAddressValid || Number(withdrawAmount) === 0) {
      setFees({ tradingFee: 0, ataFee: 0 });
      return;
    }

    try {
      const params = {
        recipientAddress: address,
        mint: token.attributes.address,
        amount: (
          Number(withdrawAmount) * Math.pow(10, token.attributes.decimals)
        ).toFixed(0),
      };
      const response = await getWithdrawFee(params);
      setFees({
        tradingFee:
          (Number(response.tradingFee) + Number(response.gasFee)) / 1e6,
        ataFee: Number(response.ataFee) / 1e6,
      });

      // 验证USDT余额是否足够支付手续费
      const totalFee =
        Number(response.tradingFee) +
        Number(response.ataFee) +
        Number(response.gasFee);
      if (totalFee / 1e6 > Number(usdtBalance?.balance_token?.ui_amount ?? 0)) {
        setIsUsdtValid(false);
        setUsdtAmount(totalFee / 1e6);
      } else {
        setIsUsdtValid(true);
      }
    } catch (error) {
      console.error("Failed to get withdraw fee:", error);
    }
  };

  // 轮询询价
  useEffect(() => {
    if (withdrawAmount && isAddressValid) {
      // 立即执行一次
      getFees();

      // 设置轮询
      const timer = setInterval(() => {
        getFees();
      }, 5000);

      // 清理函数
      return () => clearInterval(timer);
    }
  }, [withdrawAmount, address, isAddressValid, usdtBalance]);

  const handleMaxAmountPress = () => {
    if (tokenBalance && tokenBalance.balance_token) {
      const maxAmount = tokenBalance.balance_token.ui_amount;
      setAmount(CoinFormatUtil.formatTokenQuantity(maxAmount));
      setWithdrawAmount(maxAmount.toString());
    }
  };

  useEffect(() => {
    const validateAddress = (value: string) => {
      console.log("validateAddress", value);
      if (value.length !== 44 && value.length !== 43) {
        setErrorMessage({
          title: i18n.t("tradeError.addressFormatError"),
          message: i18n.t("tradeError.pleaseCheckYourInput"),
        });
        setIsAddressValid(false);
        return false;
      } else {
        setIsAddressValid(true);
        return true;
      }
    };

    validateAddress(address);
  }, [address]);

  useEffect(() => {
    const validateAmount = (value: string) => {
      console.log("validateAmount", value);
      if (!isAddressValid || !tokenBalance || !thresholds) return;

      const tokenUiAmount = tokenBalance.balance_token.ui_amount;
      const tokenUsdValue = tokenBalance.balance_usd;
      const valueUsd = Number(value) * (Number(tokenUsdValue) / tokenUiAmount);

      console.log("withdrawAmount", withdrawAmount);
      console.log("tokenUiAmount", tokenUiAmount);

      // 使用 Math.floor 向下取整
      setAmountUsd(valueUsd);

      if (valueUsd < thresholds?.minAmount) {
        setIsAmountValid(false);
        setErrorMessage({
          title: i18n.t("tradeError.tooSmall"),
          message: i18n.t("tradeError.minAmount", {mode: i18n.t(`modes.cashout`), amount: thresholds!.minAmount}),
        });
        return false;
      } else if (Number(value) > tokenUiAmount) {
        setIsAmountValid(false);
        setErrorMessage({
          title: i18n.t("tradeError.insufficientBalance"),
          message: i18n.t("tradeError.pleaseCheckYourInput"),
        });
        return false;
      }
      setIsAmountValid(true);
      return true;
    };

    validateAmount(withdrawAmount);
  }, [withdrawAmount, isAddressValid, tokenBalance, thresholds]);

  // 处理金额输入
  const handleAmountChange = (value: string) => {
    // 匹配数字和小数点的正则表达式
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) {
      return;
    }

    // 检查小数点后的位数
    const parts = value.split(".");
    if (parts.length === 2 && parts[1].length > decimals) {
      return;
    }

    setAmount(value);
    setWithdrawAmount(value);
  };

  // 处理地址输入
  const handleAddressChange = (value: string) => {
    // 只允许Base58字符集: 1-9, A-H, J-N, P-Z, a-k, m-z
    const regex = /^[1-9A-HJ-NP-Za-km-z]{0,44}$/;
    if (value === "" || regex.test(value)) {
      setAddress(value);
    }
  };

  // // 处理地址簿按钮点击
  // const handleAddressTablePress = () => {
  //   navigation.navigate(RouterName.ADDRESS_LIST);
  // };

  // 处理下一步按钮点击
  const handleNextPress = () => {
    Keyboard.dismiss();
    if(!isAddressValid || !isAmountValid){
      setShowError(true);
      return;
    }else if(!isUsdtValid){
      setErrorMessage({
        title: i18n.t("tradeError.insufficientUsdt"),
        message: i18n.t("tradeError.minUsdt", {
          amount: usdtAmount,
        }),
      });
      setShowError(true);
      return;
    }

    setShowConfirm(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
            <AppBar
              title={i18n.t("cashout.onChainCashout")}
              onBack={() => {
                navigation.goBack();
              }}
            />
          <ScrollView 
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} style={styles.content}>
                {/* 主内容区 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {i18n.t("common.network")}
                  </Text>
                  <View style={styles.inputInfo}>
                    <SolanaIcon width={24} height={24} />
                    <Text style={styles.networkName}>Solana</Text>
                  </View>
                </View>

                {/* 币种选择 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {i18n.t("cashout.currency")}
                  </Text>
                  <View style={styles.inputInfo}>
                    <TokenIcon icon={token.attributes.image} size={24} />
                    <Text style={styles.currencyName}>
                      {token.attributes.symbol}
                    </Text>
                  </View>
                </View>

                {/* 地址输入 */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: Theme.text[100] }]}>
                    {i18n.t("cashout.address")}
                  </Text>
                  <View style={styles.addressInputContainer}>
                    <TextInput
                      style={styles.addressInput}
                      placeholder={i18n.t("cashout.enterBlockchainAddress")}
                      placeholderTextColor={Theme.text[100]}
                      value={address}
                      onChangeText={handleAddressChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          setErrorMessage({
                            title: "功能开发中",
                            message: "敬请期待",
                          });
                          setShowError(true);
                        }}
                      >
                        <ScanIcon />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          setErrorMessage({
                            title: "功能开发中",
                            message: "敬请期待",
                          });
                          setShowError(true);
                        }}
                      >
                        <AddressTableIcon />
                      </TouchableOpacity>
                  </View>
                </View>

                {/* 金额输入 */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: Theme.text[100] }]}>
                    {i18n.t("cashout.amount")}
                  </Text>
                  <View
                    style={[
                      styles.addressInputContainer,
                      !isAddressValid && {
                        backgroundColor: Theme.background[100],
                      },
                    ]}
                  >
                    <TextInput
                      style={styles.addressInput}
                      placeholder={
                        CoinFormatUtil.formatTokenQuantity(
                          tokenBalance?.balance_token?.ui_amount
                        ) || "0"
                      }
                      placeholderTextColor={Theme.text[100]}
                      value={amount}
                      onChangeText={handleAmountChange}
                      keyboardType="numeric"
                      editable={isAddressValid}
                    />
                    <Text style={styles.approximateAmount}>
                      ≈$ {CoinFormatUtil.formatPrice(amountUsd)}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.maxButton,
                        !isAddressValid && {
                          backgroundColor: Theme.background[300],
                        },
                      ]}
                      disabled={!isAddressValid}
                      onPress={handleMaxAmountPress}
                    >
                      <Text style={styles.maxButtonText}>MAX</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 提现信息 */}
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.balanceLabel}>
                      {i18n.t("cashout.availableAmount")}
                    </Text>
                    <Text style={styles.balanceLabel}>
                      {CoinFormatUtil.formatTokenQuantity(
                        tokenBalance?.balance_token?.ui_amount
                      ) || "0"}{" "}
                      {token.attributes.symbol}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      {i18n.t("feeInfo.feeAndGas")}
                    </Text>
                    <Text style={styles.infoValue}>
                      ≈ $ {fees.tradingFee.toFixed(4)}
                    </Text>
                  </View>
                  {fees.ataFee > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>
                        {i18n.t("feeInfo.ataFee")}
                      </Text>
                      <Text style={styles.infoValue}>
                        $ {fees.ataFee.toFixed(4)}
                      </Text>
                    </View>
                  )}
                </View>
            </TouchableWithoutFeedback>
          </ScrollView>
          {/* 底部按钮 */}
            <Button
              type="primary"
              onPress={handleNextPress}
              style={{marginBottom: 16}}
              disabled={!isAddressValid || !isAmountValid || !isUsdtValid}
            >
              {i18n.t("common.next")}
            </Button>
        <BottomSheet
          isVisible={showConfirm}
          onClose={() => setShowConfirm(false)}
          height="80%"
        >
          <CashoutConfirm
            isVisible={showConfirm}
            onBack={() => navigation.goBack()}
            onClose={() => setShowConfirm(false)}
            amount={withdrawAmount}
            fees={fees}
            recipientAddress={address}
            network="Solana"
            tokenAttributes={token.attributes}
            tokenBalance={tokenBalance as TokenBalanceData}
          />
        </BottomSheet>

        <ErrorBottomSheet
          errorMessage={errorMessage}
          onClose={() => {
            setShowError(false);
          }}
          onConfirm={() => {
            setShowError(false);
          }}
          visible={showError}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  content: {
    gap: 16,
  },
  inputGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[300],
  },
  inputInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  networkName: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  currencyName: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  inputContainer: {
    flexDirection: "column",
    gap: 8,
  },
  addressInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.background[300],
    borderRadius: 12,
    gap: 8,
  },
  addressInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Theme.text[300],
    paddingHorizontal: 12,
  },
  iconButton: {
    width: '10%',
  },
  approximateAmount: {
    fontSize: 14,
    color: Theme.text[100],
  },
  maxButton: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  maxButtonText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  infoContainer: {
    backgroundColor: Theme.background[100],
    borderRadius: 12,
    padding: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  balanceLabel: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  infoLabel: {
    fontSize: 14,
    color: Theme.text[100],
  },
  infoValue: {
    fontSize: 14,
    color: Theme.text[100],
    fontFamily: FontFamily.medium,
  },
});

export default CashoutScreen;
