import { useEffect } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Theme } from "../../constants/Theme";
import { TokenStorage } from "../../storage";
import { RouterName, NavigatorName } from "../../constants/navigation";
import * as SplashScreen from 'expo-splash-screen';
import { inviteService } from "../../services/invite";

// 保持启动屏幕可见
SplashScreen.preventAutoHideAsync();

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const initialize = async () => {
      try {
        // 判断是否已登录
        const isAuthenticated = await TokenStorage.getToken();
        console.log("🔑 isAuthenticated", isAuthenticated);
        
        // 隐藏启动屏幕
        await SplashScreen.hideAsync();
        
        if (isAuthenticated) {
          // // 检查是否有待处理的邀请码
          // const invitationCode = await inviteService.getPendingInvitationCode();
          // if (invitationCode) {
          //   // 有邀请码，跳转到 Auth 栈的邀请码页面
          //   navigation.replace(NavigatorName.AUTH_STACK, {
          //     screen: RouterName.INVITATIONCODESCREEN,
          //     params: { code: invitationCode }
          //   });
          // } else {
            // 无邀请码，跳转到主页
            navigation.replace(NavigatorName.MAIN_TAB);
        } else {
          // 未登录，跳转到 Auth 栈
          navigation.replace(NavigatorName.AUTH_STACK);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        await SplashScreen.hideAsync();
        // 发生错误时，跳转到 Auth 栈
        navigation.replace(NavigatorName.AUTH_STACK);
      }
    };

    initialize();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }} />
  );
};

export default LandingScreen
