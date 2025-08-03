import React, { useState } from 'react';
import { RouterName } from '../../constants/navigation';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Image, KeyboardAvoidingView } from 'react-native';
import { Theme } from '../../constants/Theme';
import { Button } from '../../components/Button';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';
import { FontFamily } from '../../constants/typo';
import { URL_CONFIG } from '../../constants/url_config';
import { useToast } from '../../contexts/ToastContext';
import SvgGradientTextText from '../../components/SvgGradientTextText';
import { getDeviceInfo } from '../../utils';
import { authService, deviceService, cryptoService } from '../../services';
import { DeviceStorage, TokenStorage, ExpiresInStorage, UserStorage, LoginTypeStorage, LoginType } from '../../storage';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { NavigationService } from '../../navigation/service';
import { NavigatorName } from '../../constants/navigation';
import bs58 from 'bs58';

const SignInScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const { showToast } = useToast();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleRequestCode = async () => {
    if (!email || loading || !agreed) return;
    if (!emailRegex.test(email)) {
      showToast('failed', { message: i18n.t('signIn.login_input_email_rule'), yPosition: '50%' }, 2000, 'simple');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 获取设备信息
      const deviceInfo = await getDeviceInfo();

      //console.log("deviceInfo", deviceInfo);

      // 调用设备注册服务
      const deviceData = await deviceService.registerDevice({
        name: deviceInfo.name,
        type: deviceInfo.type,
        udid: deviceInfo.udid,
      });

      // 获取存储的 FCM Token 并更新到后端
      const fcmToken = await DeviceStorage.getFCMToken();
      if (fcmToken) {
        await deviceService.updateDeviceMessagingToken(deviceData.id, fcmToken);
      }

      // 请求验证码
      const codeResponse = await authService.requestCode({
        email,
        deviceId: deviceData.id,
      });

      setLoading(false);

      navigation.navigate(RouterName.VERIFICATION, {
        email,
        deviceId: deviceData.id,
        captchaId: codeResponse.captchaId,
        referralCode: referralCode || undefined,
        type: 'login',
      });
    } catch (error: any) {
      setLoading(false);
      console.log('error', error);
      showToast('failed', { message: error.message || i18n.t('common.error'), yPosition: '50%' }, 2000, 'simple');
    }
  };

  const handleMobileWalletLogin = async () => {
    if (walletLoading) return;

    setWalletLoading(true);
    try {
      const result = await transact(async wallet => {
        // 请求连接钱包
        const authorization = await wallet.authorize({
          cluster: 'mainnet-beta', // 或 'devnet' 用于测试
          identity: {
            name: 'Evrey',
            uri: 'https://evrey.app',
            icon: 'favicon.ico', // 可选：应用图标
          },
        });

        return authorization;
      });

      if (result && result.accounts && result.accounts.length > 0) {
        console.log('✈️✈️✈️ Wallet connection result:', result);
        console.log('✈️✈️✈️ First account:', result.accounts[0]);

        // 获取设备信息
        const deviceInfo = await getDeviceInfo();
        console.log('✈️✈️✈️ deviceInfo', deviceInfo);

        const deviceData = await deviceService.registerDevice({
          name: deviceInfo.name,
          type: deviceInfo.type,
          udid: deviceInfo.udid,
        });
        console.log('✈️✈️✈️ deviceData', deviceData);

        // 获取存储的 FCM Token 并更新到后端
        const fcmToken = await DeviceStorage.getFCMToken();
        if (fcmToken) {
          await deviceService.updateDeviceMessagingToken(deviceData.id, fcmToken);
        }

        // 生成 RSA 密钥对用于加密
        const keys = await cryptoService.generateRSAKeys();
        console.log('✈️✈️✈️ RSA keys generated');

        // 将 Base64 地址转换为 Base58 格式的 Solana 地址
        const base64Address = result.accounts[0].address;
        console.log('✈️✈️✈️ Base64 address:', base64Address);

        // 解码 Base64 为字节数组，然后编码为 Base58
        const addressBytes = Buffer.from(base64Address, 'base64');
        const walletAddress = bs58.encode(addressBytes);
        console.log('✈️✈️✈️ Base58 walletAddress:', walletAddress);

        // 调用钱包认证接口
        const walletAuthResponse = await authService.authenticateWallet(
          walletAddress,
          deviceData.id,
          'mobile-wallet-adapter',
          keys.public,
          referralCode || undefined
        );

        console.log('Wallet authentication response:', walletAuthResponse);

        // CHANGE: 不需要再生成密钥对
        // 因此 getStoredKeypair 会返回空，钱包登录不使用getStoredKeypair
        // 解密助记词并生成钱包密钥对
        // const decryptedMnemonic = await cryptoService.decryptRSAKeys(walletAuthResponse.wallet.bundle, keys.private);
        // console.log('Mnemonic decrypted');

        // await cryptoService.generateAndStoreKeypair(decryptedMnemonic);
        // console.log('Keypair generated and stored');

        // 设置令牌和用户信息
        await Promise.all([
          TokenStorage.setToken(walletAuthResponse.auth.accessToken, walletAuthResponse.auth.refreshToken),
          ExpiresInStorage.set(walletAuthResponse.auth.expiresIn.toString()),
          UserStorage.setUserInfo(walletAuthResponse.userinfo),
          LoginTypeStorage.setLoginType(LoginType.WALLET), // 保存钱包登录方式
        ]);

        showToast(
          'success',
          {
            message: `钱包登录成功！地址：${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`,
            yPosition: '50%',
          },
          3000,
          'simple'
        );

        // 导航到主页面
        NavigationService.reset(NavigatorName.MAIN_TAB);
      } else {
        showToast('failed', { message: '钱包连接失败', yPosition: '50%' }, 2000, 'simple');
      }
    } catch (error: any) {
      console.error('Mobile wallet connection error:', error);
      let errorMessage = '钱包连接失败';

      if (error.code === 'USER_REJECTED') {
        errorMessage = '用户取消了钱包连接';
      } else if (error.code === 'WALLET_NOT_FOUND') {
        errorMessage = '未找到兼容的钱包应用';
      } else if (error.message?.includes('not installed')) {
        errorMessage = '请先安装支持的钱包应用';
      }

      showToast('failed', { message: errorMessage, yPosition: '50%' }, 2000, 'simple');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleLinkPress = async (url: string, title: string) => {
    navigation.navigate(RouterName.WEBVIEW, { url, title });
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.welcomeContainer}>
          <SvgGradientTextText fontSize={35} text={i18n.t('signIn.welcome')} />
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/banner.png')} style={styles.logo} resizeMode="contain" />
          </View>
          {/* <Text style={styles.description}>{i18n.t("signIn.description")}</Text> */}
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={i18n.t('signIn.placeholder')}
            placeholderTextColor={Theme.text[50]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={i18n.t('signIn.referralCodePlaceholder')}
            placeholderTextColor={Theme.text[50]}
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={[styles.checkbox, agreed && styles.checkedBox]}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              {i18n.t('signIn.terms')}{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  handleLinkPress(
                    URL_CONFIG.USER_PROTOCOL_URL[i18n.locale as 'zh' | 'en'],
                    i18n.t('signIn.termsOfService')
                  )
                }
              >
                {i18n.t('signIn.termsOfService')}
              </Text>{' '}
              {i18n.t('signIn.and')}{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  handleLinkPress(
                    URL_CONFIG.PRIVACY_POLICY_URL[i18n.locale as 'zh' | 'en'],
                    i18n.t('signIn.privacyPolicy')
                  )
                }
              >
                {i18n.t('signIn.privacyPolicy')}
              </Text>
            </Text>
          </View>
          <Button type="primary" disabled={!agreed || !email} onPress={handleRequestCode} loading={loading}>
            {i18n.t('signIn.getCode')}
          </Button>

          {/* 分割线 */}
          {/* <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* 钱包登录按钮 */}
          {/* <Button
            type="secondary"
            onPress={handleMobileWalletLogin}
            loading={walletLoading}
            loadingColor={Theme.primary}
            style={styles.walletButton}
            textStyle={styles.walletButtonText}
          >
            🔮 钱包登录
          </Button> */}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background[50],
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logo: {
    width: 300,
    height: 100,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Theme.background[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: Theme.text[300],
    backgroundColor: Theme.background[50],
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: Theme.background[300],
    borderRadius: 9,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: Theme.brand.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[50],
    lineHeight: 18,
  },
  link: {
    color: Theme.text[200],
    textDecorationLine: 'underline',
    fontFamily: FontFamily.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.background[300],
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
  },
  walletButton: {
    backgroundColor: Theme.background[100],
    borderWidth: 1,
    borderColor: Theme.background[300],
  },
  walletButtonText: {
    color: Theme.text[300],
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
});

export default SignInScreen;
