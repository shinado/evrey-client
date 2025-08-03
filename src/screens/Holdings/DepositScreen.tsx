import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { cryptoService } from '../../services';
import { QrCodeSvg } from 'react-native-qr-svg';
import * as Clipboard from 'expo-clipboard';
import { Theme } from '../../constants/Theme';
import { FontFamily } from '../../constants/typo';
import { SolanaIcon, USDTIcon} from '../../constants/icons';
import i18n from '../../i18n';
import { useToast } from '../../contexts/ToastContext';
import SearchLayout from '../../layouts/SearchLayout';
import { Button } from '../../components/Button';

type DepositScreenProps = {
  onClose?: () => void;
  navigation?: any;
};

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose, navigation }) => {
  const { showToast } = useToast();
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // 获取钱包地址
    cryptoService.getWalletAddress()
      .then(key => {
        if (key) setPublicKey(key);
      })
      .catch(error => {
        console.error('获取钱包地址失败:', error);
      });
  }, []);

  // 复制地址到剪贴板
  const copyToClipboard = async () => {
    if (publicKey) {
      await Clipboard.setStringAsync(publicKey);
      showToast("success", {message: i18n.t('common.copy_success')}, 3000, "simple");
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <SearchLayout 
      title={i18n.t('modes.deposit')} 
      onClose={handleClose}
    >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 提示信息 */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color={Theme.text[100]} />
            <Text style={styles.warningText}>
              {i18n.t('deposit.warning')}
            </Text>
          </View>

          {/* 网络选择 */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{i18n.t('common.network')}</Text>
            <View style={styles.selector}>
              <SolanaIcon width={24} height={24} />
              <Text style={styles.selectorText}>Solana</Text>
            </View>
          </View>

          {/* 币种选择 */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{i18n.t('deposit.currency')}</Text>
            <View style={styles.selector}>
              <USDTIcon width={24} height={24} />
              <Text style={styles.selectorText}>USDT</Text>
            </View>
          </View>

          {/* 二维码 */}
          <View style={styles.qrCodeContainer}>
            {publicKey ? (
              <QrCodeSvg
                value={publicKey}
                frameSize={200}
                contentCells={5}
                errorCorrectionLevel="H"
                dotColor="black"
                backgroundColor="white"
              />
            ) : (
              <View style={styles.loadingQR}>
                <Text style={styles.loadingText}>{i18n.t('common.loading')}</Text>
              </View>
            )}
          </View>

          {/* 地址显示 */}
          <Text style={styles.addressText}>
            {publicKey && publicKey}
          </Text>

          {/* 复制地址按钮 */}
          <Button
            type="primary"
            onPress={copyToClipboard}
            disabled={!publicKey}
            style={styles.copyButton}
          >
            {i18n.t('deposit.copyAddress')}
          </Button>

          {/* 最小充值提示 */}
          <Text style={styles.minDepositText}>
            {i18n.t('deposit.minDeposit')}
          </Text>
        </ScrollView>
    </SearchLayout>
  );
};

const styles = StyleSheet.create({
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background[100],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    lineHeight: 20,
  },
  sectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[300],
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
  },
  qrCodeContainer: {
    alignSelf: 'center',
    marginVertical: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingQR: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.background[100],
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[100],
  },
  addressText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[300],
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '80%',
    marginBottom: 20,
  },
  copyButton: {
    marginBottom: 20,
  },
  minDepositText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default DepositScreen;