import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { NavigationService } from "../../navigation/service";
import { NavigatorName } from "../../constants/navigation";
import { useNavigation } from "@react-navigation/native";
import { ExpiresInStorage, TokenStorage, UserStorage, LoginTypeStorage, LoginType } from "../../storage";
import { onboardingStorage } from "../../storage/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { inviteService, authService, userService, cryptoService } from "../../services";
import i18n from "../../i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../contexts/ToastContext";
import VerificationCodeInput from "../../components/VerificationCodeInput";

const VerificationScreen = ({ route }: { route: any }) => {
  const { email, deviceId, referralCode, type = "login" } = route.params;
  const [captchaId, setCaptchaId] = useState(route.params.captchaId);
  const [keys, setKeys] = useState({
    public: "",
    private: "",
  });
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("🚀 VerificationScreen: Starting initialization...");

        if (type === "login") {
          // 1. 生成密钥对
          const [generatedKeys, code] = await Promise.all([
            cryptoService.generateRSAKeys(),
            inviteService.getPendingInvitationCode(),
          ]);

          console.log("✅ Keys generated:", !!generatedKeys.public);
          console.log("✅ Invitation code:", !!code);

          // 更新状态
          setKeys(generatedKeys);
        }
      } catch (error) {
        console.error("❌ Initialization error:", error);
      }
    };

    initialize();
  }, [type]);

  const handleSignIn = async (verificationCode: string) => {
    if (!verificationCode) return;

    try {
      if (type === "login") {
        const t1 = Date.now();
        // 1. 登录验证和令牌设置
        const authData = await authService.signIn(
          deviceId,
          captchaId,
          verificationCode,
          keys.public,
          referralCode
        );

        console.log("⏱️ Sign in API took:", Date.now() - t1, "ms");

        const t2 = Date.now();
        // 2. 解密和生成密钥对
        const decryptedMnemonic = await cryptoService.decryptRSAKeys(
          authData.wallet.bundle,
          keys.private
        );
        console.log("✅ Mnemonic decrypted");

        await cryptoService.generateAndStoreKeypair(decryptedMnemonic);
        console.log("✅ Keypair generated and stored");

        // 3. 设置令牌和用户信息
        await Promise.all([
          TokenStorage.setToken(authData.auth.accessToken, authData.auth.refreshToken),
          ExpiresInStorage.set(authData.auth.expiresIn.toString()),
          UserStorage.setUserInfo(authData.userinfo),
          LoginTypeStorage.setLoginType(LoginType.EMAIL), // 保存邮箱登录方式
        ]);
        console.log('🔑 Token and user info set', authData);
        console.log("⏱️ Set token and decrypt took:", Date.now() - t2, "ms");

        // await onboardingStorage.resetInterestsStatus(); // Just for testing
        // 4. 检查用户是否已完成兴趣选择
        const isInterestsCompleted = await onboardingStorage.isInterestsCompleted(authData.userinfo.id);
        
        if (isInterestsCompleted) {
          // 已完成兴趣选择，直接进入主应用
          NavigationService.reset(NavigatorName.MAIN_TAB);
        } else {
          // 未完成兴趣选择，进入引导流程
          NavigationService.reset(NavigatorName.ONBOARDING_STACK);
        }
      } else if (type === "delete") {
        // 处理注销验证
        const result = await userService.accountCancellation(
          captchaId,
          verificationCode
        );

        console.log("🔑 Account cancellation result:", result);
        
        if (result) {
          // 注销成功，清除本地存储并返回登录页
          await UserStorage.handleSignOut();
          NavigationService.reset(NavigatorName.AUTH_STACK);
        } else {
          throw new Error(i18n.t("userSetting.no_logout_info"));
        }
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      showToast("failed", {
        message: i18n.t("verification.messages.error.message"), 
        yPosition: '50%'
      }, 2000, "simple");
      // 抛出错误，让 VerificationCodeInput 知道验证失败
      throw error;
    }
  };

  const handleResend = async () => {
    try {
      if (type === "login") {
        const response = await authService.requestCode({
          email,
          deviceId
        });
        // 更新 captchaId
        setCaptchaId(response.captchaId);
      } else if (type === "delete") {
        const {captchaId} = await userService.getAccountCancellationCode();
        setCaptchaId(captchaId);
      }
    } catch (error: any) {
      console.error("Resend code error:", error);
      showToast("failed", {message: error?.message || i18n.t("verification.messages.error.message"), yPosition: '50%'}, 2000, "simple");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        hitSlop={20}
        onPress={() => navigation.pop()}
      >
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <VerificationCodeInput
          onSubmit={handleSignIn}
          onResend={handleResend}
          title={type === "delete" ? i18n.t("verification.delete_title") : i18n.t("verification.title")}
          subtitle={i18n.t("verification.subtitle")}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  backButton: {
    padding: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
    flex: 1,
  },
});

export default VerificationScreen;
