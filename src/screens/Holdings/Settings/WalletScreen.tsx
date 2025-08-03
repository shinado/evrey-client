import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import IconCopy from '../../../../assets/rebate/icon_copy.svg';
import { SolanaIcon } from '../../../constants/icons';
import IconInfo from "../../../../assets/userSettings/icon_info.svg";
import {Theme} from "../../../constants/Theme";
import QRCode from "react-native-qrcode-svg";
import {FontFamily} from "../../../constants/typo";
import * as Clipboard from "expo-clipboard";
import i18n from "../../../i18n";
import AppBar from "../../../components/AppBar";
import { SafeAreaView } from "react-native-safe-area-context";
import {cryptoService} from "../../../services";
import { useToast } from '../../../contexts/ToastContext';


type UserExternalWallet = {
  chainType: number;
  icon: string;
  name: string;
  walletAddress: string;
};

const WalletScreen: React.FC = () => {
  const defaultUserWalletInfo:UserExternalWallet[] = [
    {
      chainType: 1,
      icon: '',
      name: 'SOL',
      walletAddress: ''
    }
  ]
  const [userWalletInfo, setUserWalletInfo] = useState<UserExternalWallet[]>(defaultUserWalletInfo);
  const { showToast } = useToast();

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast("success", {message: i18n.t("common.copy_success")}, 3000, "simple");
  };

  useEffect(() => {
    cryptoService.getWalletAddress()
      .then(key => {
        if (key){
          setUserWalletInfo([{
            chainType: 1,
            name: 'SOL',
            icon: '', // todo 需要真实的 name 和 icon 现在弄不过来 临时这样写
            walletAddress: key
          }])
        }
      })
      .catch(error => {
        setUserWalletInfo(defaultUserWalletInfo);
        console.error('获取钱包地址失败:', error);
      });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* 返回按钮 */}
      <AppBar title={i18n.t("userSetting.my_wallet")}></AppBar>

      <ScrollView style={styles.containerScroll}>
        {
          userWalletInfo && userWalletInfo.map((item: UserExternalWallet, index: number) => {
            return (
              <View key={index}>
                <View style={styles.walletDescBox}>
                  <IconInfo width={14} height={14} />
                  <View style={styles.walletTextBox}>
                    <Text style={styles.walletDesc}>{i18n.t("userSetting.coin_tip")}</Text>
                  </View>
                </View>
                {/* 二维码区域 */}
                <View style={styles.qrCodeContainer}>
                  <View style={styles.qrCodeBackground}>
                    {
                      item.walletAddress &&
                      <QRCode
                        value={item.walletAddress} // 这里是你的二维码内容
                        size={206} // 二维码大小
                        color="black"
                        backgroundColor="white"
                      />
                    }
                  </View>
                </View>

                {/* 钱包信息 */}
                <View style={styles.walletInfo}>
                  <View style={styles.walletItem}>
                    <Text style={styles.walletItemLabel}>{i18n.t("userSetting.network")}</Text>
                    <View style={styles.walletInfoNames}>
                      <SolanaIcon width={18} height={18} />
                      <Text style={styles.currencyLabel}>{item.name}</Text>
                    </View>
                  </View>
                  <View style={styles.walletItem}>
                    <Text style={styles.walletItemLabel}>{i18n.t("userSetting.address")}</Text>
                    <View style={styles.addressBox}>
                      <View style={{width: 206}}>
                        <Text style={styles.walletAddressText}>{item.walletAddress}</Text>
                      </View>
                      <TouchableOpacity onPress={()=> {handleCopy(item.walletAddress)}}>
                        <IconCopy  width={14} height={14}  />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        }
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsText: {
    flex: 1,
    flexDirection: 'row',
    textAlign: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingRight: 10
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  walletInfo: {
    marginBottom: 20,
    marginTop: 24,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  walletItemLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    fontWeight: '400',
    color: Theme.text[100]
  },
  walletInfoNames: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginLeft: 8
  },
  addressBox: {
    flexDirection:"row",
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    width: "80%"
  },
  walletAddressText: {
    fontSize: 13,
    color: Theme.text[300],
    marginRight: 12,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeBackground: {
    backgroundColor: Theme.background[100],
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 17,
    borderWidth: 1,
    borderColor: Theme.background[300],
    marginTop: 24,
  },
  qrCodeText: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 8,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
  },
  containerScroll: {
    flex: 1,
  },
  walletDescBox: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: Theme.background[100],
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  walletTextBox: {
    marginLeft: 8,
    flex: 1
  },
  walletDesc: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1
  }
});

export default WalletScreen;
