import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import Slider from './Slider';
import i18n from '../i18n';
import { SolanaIcon } from '../constants/icons';
import { Ionicons } from "@expo/vector-icons";
import { eventBus, Trade } from '../services/config/eventBus';
import { TokenAttributes } from '../types/token';
import { TokenBalanceData } from '../types/token';
import { swapService } from '../services/trading/swap';
import SearchLayout from '../layouts/SearchLayout';
import { CoinFormatUtil } from '../utils/format';
import { useKeypairList } from '../hooks/useKeypairList';

interface CashoutConfirmProps {
  isVisible: boolean;
  onClose: () => void;
  amount: string;
  fees: {
    tradingFee: number;
    ataFee: number;
  };
  recipientAddress: string;
  network: string;
  tokenAttributes: TokenAttributes;
  tokenBalance: TokenBalanceData;
  onBack: () => void;
}

const CashoutConfirm: React.FC<CashoutConfirmProps> = ({
  onBack,
  onClose,
  amount,
  fees,
  recipientAddress,
  network,
  tokenAttributes,
  tokenBalance,
}) => {
  const { withdraw } = swapService();
  const { createProof } = useKeypairList();

  const handleSlideComplete = async () => {
    await handleCashoutTransaction();
  };

  const handleCashoutTransaction = async () => {
    try {
      if (!tokenBalance) return null;

      // 1. 创建加密 proof
      console.log("starting creatProof 🫥🫥🫥🫥🫥")
      const proof = await createProof();
      console.log("proof🫥🫥🫥🫥", proof);

      // 2. 获取待签名交易
      const signedResult = await withdraw({
        recipientAddress,
        mint: tokenAttributes.address,
        amount: (Number(amount) * Math.pow(10, tokenAttributes.decimals)).toFixed(0),
        proof: {
          kid: proof.kid,
          encrypted: proof.encrypted
        }
      });

      // 3. 发送交易到后台处理
      const trade: Trade = {
        id: Date.now().toString(),
        mode: 2, // 提现
        status: 0,
        token: tokenAttributes.address,
        amount: Number(amount),
        bigAmount: (Number(amount) * Math.pow(10, tokenAttributes.decimals)).toFixed(0),
        symbol: tokenAttributes.symbol,
        recipientAddress: recipientAddress,
        payload: signedResult.payload,
        signedTx: signedResult.signedTx,
        proof: signedResult.proof,
        secret: proof.secret // 保存 secret 用于验证
      };
      
      eventBus.emit("TRADE_NEW", trade);
      onClose();
      onBack();
      return null;
    } catch (error: any) {
      console.log('error',error);
      if (error!==null && error.type === 'email' || error.type === 'google') {
        return error;
      }else {
        eventBus.emit('TRADE_UPDATE', {
          id: Date.now().toString(),
          status: -1,
          mode: 2,
          symbol: tokenAttributes.symbol,
          token: tokenAttributes.address,
          error: error.errorMessage
        } as Trade);
        onClose();
        return null;
      };
    }
  };

  return (
    <SearchLayout
      title={i18n.t('cashout.confirm.title')}
      onClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.subtitleContainer}>
          <Ionicons name="information-circle-outline" size={16} color={Theme.text[100]} />
          <Text style={styles.subtitle}>{i18n.t('cashout.confirm.tip')}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{i18n.t('cashout.confirm.arrivalAmountLabel')}</Text>
          <Text style={styles.amount}>{CoinFormatUtil.formatTokenQuantity(amount)} {tokenAttributes.symbol}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{i18n.t('cashout.confirm.withdrawAmountLabel')}</Text>
            <Text style={styles.infoValue}>{CoinFormatUtil.formatTokenQuantity(amount)} {tokenAttributes.symbol}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{i18n.t('feeInfo.feeAndGas')}</Text>
            <Text style={styles.infoValue}>≈ ${fees.tradingFee.toFixed(4)}</Text>
          </View>
          {fees.ataFee > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{i18n.t('feeInfo.ataFee')}</Text>
              <Text style={styles.infoValue}>≈ ${fees.ataFee.toFixed(4)}</Text>
            </View>
          )}


          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{i18n.t('cashout.confirm.addressLabel')}</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.infoValue}>{recipientAddress}</Text>
            </View>
          </View>


          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{i18n.t('common.network')}</Text>
            <View style={styles.networkRow}>
              <SolanaIcon width={16} height={16} />
              <Text style={[styles.infoValue, styles.networkText]}>{network}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            title={i18n.t('common.swipe') + i18n.t('modes.cashout')}
            onTouchStart={() => {}}
            onSwipeComplete={handleSlideComplete}
            height={58}
          />
        </View>
      </View>
    </SearchLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
  infoContainer: {
    backgroundColor: Theme.background[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    maxWidth: '50%',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
    textAlign: 'right',
  },
  sliderContainer: {
    marginTop: 'auto',
    marginBottom: 26,
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  networkText: {
    marginLeft: 0,
  },
  addressContainer: {
    flexDirection: 'column',
    flex: 1,
    marginLeft: 12,
  },
});

export default CashoutConfirm; 