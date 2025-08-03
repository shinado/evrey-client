import React, { useState, useEffect, useRef, useCallback} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Theme } from '../../../constants/Theme';
import { FontFamily } from '../../../constants/typo';
import TokenIcon from '../../../components/TokenIcon';
import NumberKeyboard from '../../../components/NumberKeyboard';
import ErrorBottomSheet, { ErrorMessage } from '../../../components/ErrorBottomSheet';
import i18n from '../../../i18n';
import { Recipient } from './SendScreen';
import SearchLayout from '../../../layouts/SearchLayout';
import Slider, { SliderRef } from '../../../components/Slider';
import { swapService, AppLaunchManagerService, ThresholdResult } from '../../../services';
import { Token } from '../../../types/token';
import { useTokenBalance } from '../../../hooks/useBalance';
import { CoinFormatUtil } from '../../../utils/format';
import { USDT_MINT } from '../../../constants/Crypto';

interface SendInputScreenProps {
  recipient: Recipient;
  token: Token;
  onBack: () => void;
  onClose: () => void;
  onConfirm: (bigAmount: string, amount: number) => void;
}

const SendInputScreen: React.FC<SendInputScreenProps> = ({
  recipient,
  token,
  onClose,
  onBack,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);
  const [fees, setFees] = useState({ tradingFee: 0, ataFee: 0 });
  const sliderRef = useRef<SliderRef>(null);
  const { getTransferFee } = swapService();
  const [isUsdtValid, setIsUsdtValid] = useState(true);
  const { tokenBalance: usdtBalance } = useTokenBalance(USDT_MINT);
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [showError, setShowError] = useState(false);
  // 使用 token 的 mint 地址获取最新数据
  const { tokenBalance } = useTokenBalance(token.attributes.address);
  const [thresholds, setThresholds] = useState<ThresholdResult | null>(null);
  const [usdtAmount, setUsdtAmount] = useState(0);

  // 在组件加载时获取阈值
  useEffect(() => {
    const fetchThresholds = async () => {
      const result = await AppLaunchManagerService.getThresholds('transfer');
      setThresholds(result);
    };
  
    fetchThresholds();
  }, []);

  // 获取手续费
  const getFees = async (value: string) => {
    if (!value || Number(value) === 0) {
      setFees({ tradingFee: 0, ataFee: 0 });
      return;
    }
    //console.log("😇 getFees value: ", value);
    try {
      const params = {
        receiverId: Number(recipient.uid),
        mint: token.attributes.address,
        amount: (Number(value) * Math.pow(10, token.attributes.decimals)).toFixed(0)
      };

      const feeInfo = await getTransferFee(params);
      setFees({
        tradingFee: Number(feeInfo.gasFee ?? 0) / 1e6,
        ataFee: Number(feeInfo.ataFee ?? 0) / 1e6,
      });

      //console.log('feeInfo', feeInfo);

      // 验证USDT余额是否足够支付手续费
      const totalFee = Number(feeInfo.ataFee ?? 0) + Number(feeInfo.gasFee ?? 0);
      if (totalFee / 1e6 > Number(usdtBalance?.balance_token?.ui_amount ?? 0)) {
        setIsUsdtValid(false);
        setUsdtAmount(totalFee / 1e6);
      } else {
        //console.log("totalFee", totalFee);
        setIsUsdtValid(true);
      }
    } catch (error) {
      console.error('Failed to get fees:', error);
    }
  };

  // 轮询询价
  useEffect(() => {
    if (transferAmount) {
      // 立即执行一次
      getFees(transferAmount);
      
      const timer = setInterval(() => {
        getFees(transferAmount);
      }, 5000);
      // 清理函数
      return () => clearInterval(timer);
    }
  }, [transferAmount, usdtBalance]); 

  // 处理数字输入
  const handleNumberPress = (num: string) => {
    if (num === '⌫') {
      setAmount(prev => prev.slice(0, -1));
      setTransferAmount(prev => prev.slice(0, -1));
      return;
    }

    const newValue = amount + num;
    const pattern = new RegExp(`^\\d*\\.?\\d{0,4}$`);

    if (pattern.test(newValue)) {
      setAmount(newValue);
      setTransferAmount(newValue);
    }
  };

  // 处理快捷金额选择
  const handleQuickAmountPress = (value: string) => {
    const balance = tokenBalance?.balance_token?.ui_amount || token.account.balance_token.ui_amount;
    let newAmount: number;

    switch (value) {
      case '25%':
        newAmount = balance * 0.25;
        break;
      case '50%':
        newAmount = balance * 0.5;
        break;
      case '75%':
        newAmount = balance * 0.75;
        break;
      case 'MAX':
        newAmount = balance;
        break;
      default:
        return;
    }
    const amountStr = value === "MAX" ? newAmount.toString() : newAmount.toFixed(4);
    setAmount(CoinFormatUtil.formatTokenQuantity(amountStr));
    setTransferAmount(amountStr);
    //getFees(amountStr);
  };

  useEffect(() => {
    const validateAmount = (value: string) => {
      console.log('validateAmount', value);
      if (!thresholds || !tokenBalance) return;
      
      const tokenUiAmount = tokenBalance?.balance_token?.ui_amount || token.account.balance_token.ui_amount;
      const tokenUsdValue = tokenBalance?.balance_usd || token.account.balance_usd;
      const valueUsd = Number(value) * (Number(tokenUsdValue) / tokenUiAmount);
      
      //console.log('🔥transferAmount', transferAmount);
      console.log('tokenUiAmount', tokenUiAmount);
      console.log('valueUsd', valueUsd)
      console.log('thresholds?.minAmount', thresholds?.minAmount)

      
      if (valueUsd < thresholds?.minAmount!) {
        console.log('valueUsd < thresholds?.minAmount');
        setIsAmountValid(false);
        setErrorMessage({ 
          title: i18n.t('tradeError.tooSmall'), 
          message: i18n.t('tradeError.minAmount', {mode: i18n.t(`modes.transfer`), amount: thresholds?.minAmount!}) 
        });
      } else if (Number(value) > tokenUiAmount) {
        console.log('Number(value) > tokenUiAmount');
        setIsAmountValid(false);
        setErrorMessage({ 
          title: i18n.t('tradeError.insufficientBalance'), 
          message: i18n.t('tradeError.pleaseCheckYourInput') 
        });
      } else {
        setIsAmountValid(true);
      }
    };

    validateAmount(transferAmount);
  }, [transferAmount, token.account, tokenBalance, thresholds]);

  // 处理滑动开始
  const handleSwipeStart = () => {
    console.log('handleSwipeStart');
    if (!isAmountValid) {
      setShowError(true);
      return false;
    } else if(!isUsdtValid) {
      setErrorMessage({
        title: i18n.t('tradeError.insufficientUsdt'),
        message: i18n.t('tradeError.minUsdt', { amount: usdtAmount })
      });
      setShowError(true);
      return false;
    }
    return true;
  };

  // 处理滑动完成
  const handleSwipeComplete = async () => {
    try {
      if (!isAmountValid || !isUsdtValid) return;
      
      // 计算 bigAmount
      const bigAmount = (Number(transferAmount) * Math.pow(10, token.attributes.decimals)).toFixed(0);
      
      // 只传递 bigAmount 和 valueUsd
      onConfirm(bigAmount, Number(amount));
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      sliderRef.current?.reset();
      return false;
    }
  };

  return (
    <SearchLayout
      title={i18n.t('modes.transfer')}
      onBack={onBack}
      onClose={onClose}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Token Info */}
        <View style={styles.tokenInfo}>
          <TokenIcon icon={token.attributes.image} size={24} />
        <Text style={styles.tokenAmount}>
          {token?.attributes?.symbol}: {CoinFormatUtil.formatTokenQuantity(tokenBalance?.balance_token?.ui_amount || token.account.balance_token.ui_amount)}
        </Text>
      </View>

      {/* Amount Input */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amountText, !amount && styles.placeholderText]}>
          {amount || Number(0).toFixed(4)}
        </Text>
        <Text style={styles.tokenValue}>
          ≈ ${amount ? (Number(amount) * (Number(tokenBalance?.balance_usd || token.account.balance_usd) / (tokenBalance?.balance_token?.ui_amount || token.account.balance_token.ui_amount))).toFixed(4) : '0.0000'}
        </Text>
      </View>

      {/* Quick Amount Buttons */}
      <View style={styles.quickButtons}>
        {['25%', '50%', '75%', 'MAX'].map((value) => (
          <TouchableOpacity
            key={value}
            style={styles.quickButton}
            onPress={() => handleQuickAmountPress(value)}
          >
            <Text style={styles.quickButtonText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fee Info */}
      <View style={styles.feeInfo}>
        <Text style={styles.feeText}>
          {i18n.t('feeInfo.gasFee')}≈ $ {fees.tradingFee.toFixed(4)}
        </Text>
        {fees.ataFee > 0 && (
          <Text style={styles.feeText}>
            {i18n.t('feeInfo.ataFee')}≈ $ {fees.ataFee.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Number Keyboard */}
      <NumberKeyboard onNumberPress={handleNumberPress} style={styles.keyboard} />
      </ScrollView>
      {/* Slider */}
      <Slider
        ref={sliderRef}
        title={`${i18n.t('common.swipe')}${i18n.t('modes.transfer')}`}
        disabled={!isAmountValid || !isUsdtValid}
        onSwipeComplete={handleSwipeComplete}
        onTouchStart={handleSwipeStart}
        height={58}
      />

      {/* 最小发送额提示 */}
      <Text style={styles.minAmountTip}>
        {i18n.t('tradeError.minAmount', {mode: i18n.t(`modes.transfer`), amount: thresholds?.minAmount!})}
      </Text>

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
    </SearchLayout>
  );
};

const styles = StyleSheet.create({
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.background[100],
    borderRadius: 12,
    marginBottom: 24,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 26,
    backgroundColor: Theme.background[100],
    alignSelf: 'center',
  },
  tokenAmount: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountText: {
    fontSize: 48,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  placeholderText: {
    color: Theme.text[100],
  },
  tokenValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[100],
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  quickButton: {
    height: 32,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Theme.background[100],
  },
  quickButtonText: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  keyboard: {
    marginTop: 12,
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  feeText: {
    fontSize: 12,
    color: Theme.text[100],
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  minAmountTip: {
    fontSize: 12,
    color: Theme.text[100],
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    marginTop: 8,
    marginBottom: 50,
  },
});

export default SendInputScreen;