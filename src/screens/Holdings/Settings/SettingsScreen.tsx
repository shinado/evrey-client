import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import IconMore from "../../../../assets/rebate/icon_more.svg";
import IconComputerHand from "../../../../assets/userSettings/icon_computer_hand.svg";
import IconLogout from "../../../../assets/userSettings/icon_logout.svg";
import IconMessage from "../../../../assets/userSettings/icon_message.svg";
import IconWallet from "../../../../assets/userSettings/icon_wallet.svg";
import BottomSheet from "../../../components/BottomSheet";
import { Theme } from "../../../constants/Theme";
import { RouterName, NavigatorName } from "../../../constants/navigation";
import { NavigationService } from "../../../navigation/service";
import { useNavigation } from "@react-navigation/native";
import { authService, userService, versionService } from "../../../services";
import { UserStorage } from "../../../storage";
import InfoModal from "../../../components/InfoModal";
import { Button } from "../../../components/Button";
import DeviceInfo from 'react-native-device-info';
import { FontFamily } from "../../../constants/typo";
import i18n from "../../../i18n";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBar from "../../../components/AppBar";
import { URL_CONFIG } from "../../../constants/url_config";
import { VersionData, UserInfoData } from "../../../types";
import UpdateModal from "../../../components/UpdateModal";
import { useToast } from "../../../contexts/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { useBalance } from "../../../hooks/useBalance";

const helpCenterImage = require("../../../../assets/userSettings/help_center_image.png");

export type ModalMessage = {
  title: string;
  message: string;
  type: string;
};
const defaultMessage: ModalMessage = {
  title: "",
  message: "",
  type: "",
};

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const [userInfoData, setUserInfoData] = useState<UserInfoData | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalContent, setInfoModalContent] = useState<
    { label: string; value?: string }[]
  >([]);
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const [appVersion, setAppVersion] = useState<string>("1.0.0");
  const [infoModalMessageType, setInfoModalMessageType] = useState<
    | "accountDeletionWarning"
    | "insufficientBalanceWarning"
    | "logoutConfirmation"
    | "helperMessage"
  >("accountDeletionWarning");

  const [modalMessage, setModalMessage] =
    useState<ModalMessage>(defaultMessage);
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const { totalBalance, loading: balanceLoading } = useBalance();

  // **信息弹窗内容**
  const infoModalMessage = {
    accountDeletionWarning: {
      title: i18n.t("userSetting.logout"),
      content: [{ label: i18n.t("userSetting.logout_info"), value: "" }],
      type: "confirm",
    },
    insufficientBalanceWarning: {
      title: i18n.t("userSetting.no_logout"),
      content: [{ label: "", value: "" }],
      type: "info",
    },
    logoutConfirmation: {
      title: i18n.t("userSetting.log_out"),
      content: [{ label: i18n.t("userSetting.log_out_info"), value: "" }],
      type: "confirm",
    },
    helperMessage: {
      title: i18n.t("userSetting.help_center"),
      content: [{ label: i18n.t("userSetting.help_center_info"), value: "" }],
      type: "info",
    },
  };

  // **打开信息弹窗**
  function openInfoModal(type: keyof typeof infoModalMessage) {
    setInfoModalMessageType(type);
    setInfoModalTitle(infoModalMessage[type].title);
    setInfoModalContent(infoModalMessage[type].content);
    setInfoModalVisible(true);
  }

  // **打开 BottomSheet**
  function openBottomSheet(
    type: keyof typeof infoModalMessage,
    message?: string
  ) {
    closeAllModals();
    setInfoModalMessageType(type);
    setModalMessage({
      title: infoModalMessage[type].title,
      message: message || infoModalMessage[type].content[0].label,
      type: infoModalMessage[type].type,
    });
    setMessageVisible(true);
  }

  // **关闭所有弹窗**
  function closeAllModals() {
    setInfoModalVisible(false);
    setMessageVisible(false);
  }

  // **检查更新**
  const [isChecking, setIsChecking] = useState(false);
  const handleVersionPress = async () => {
    setIsChecking(true);
    try {
      const res = await versionService().checkUpdate();
      if (res.needsUpdate) {
        setVersionData(res);
        setIsVisible(true);
      } else {
        showToast("success", {message: i18n.t("common.latestVersion"), yPosition: '50%'}, 1000, "simple");
      }
    } catch (error) {
      console.error("检查更新失败:", error);
      showToast("failed", {message: i18n.t("common.checkUpdateFailed"), yPosition: '50%'}, 2000, "simple");
    } finally {
      setIsChecking(false);
    }
  };

  // **注销账户**
  const [isDestroying, setIsDestroying] = useState(false);
  const destroyAccount = async () => {
    setIsDestroying(true);
    try {
      const {captchaId} = await userService.getAccountCancellationCode();
      console.log("captchaId", captchaId);
      closeAllModals();
      navigation.navigate(NavigatorName.AUTH_STACK, {
        screen: RouterName.VERIFICATION,
        params: {
          captchaId,
          type: "delete"
        }
      });
    } catch (error) {
      closeAllModals();
      console.error("注销请求异常:", error);
      openBottomSheet("insufficientBalanceWarning", "注销失败，请稍后再试");
    } finally {
      setIsDestroying(false);
    }
  };

  // **退出登录**
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      await UserStorage.handleSignOut(queryClient);
      NavigationService.reset(NavigatorName.AUTH_STACK);
    } catch (error) {
      console.error("退出登录异常:", error);
      showToast("failed", {message: i18n.t("common.error"), yPosition: '50%'}, 2000, "simple");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 删除账号前的检查
  const deleteAccount = () => {
    if (userInfoData?.referralId) {
      closeAllModals();
      openBottomSheet(
        "insufficientBalanceWarning",
        i18n.t("userSetting.no_logout_info_2")
      );
      return;
    }
    if (Number(totalBalance ?? 0) >= 10) {
      closeAllModals();
      openBottomSheet(
        "insufficientBalanceWarning",
        i18n.t("userSetting.no_logout_info")
      );
      return;
    }
    openInfoModal("accountDeletionWarning");
  };

  // **设置项数据**
  const settingsData = [
    {
      title: i18n.t("userSetting.my_wallet"),
      beforeIcon: <IconWallet width={20} height={20} />,
      icon: <IconMore width={16} height={16} />,
      navigationTo: () => navigation.push(RouterName.WALLET),
    },
    {
      title: i18n.t("settings.interests"),
      beforeIcon: <IconMessage width={20} height={20} />,
      icon: <IconMore width={16} height={16} />,
      navigationTo: () => navigation.navigate(RouterName.INTEREST_SELECTION, { fromSettings: true }),
    },
    /*{
      title: i18n.t("userSetting.user_card"),
      beforeIcon: <IconUser width={20} height={20} />,
      icon: <IconMore width={16} height={16} />,
      navigationTo: async () => {
        try {
          show({ blockInteraction: true });
          const res = await authService.getUserPlatformCode({
            pageNo: 1,
            pageSize: 2,
          });
          dismiss();
          if (res.list.length) {
            navigation.push(RouterName.IDENTITY_CODE);
          } else {
            navigation.push(RouterName.IDENTIFICATIONCODE);
          }
        } catch (error) {
          dismiss();
        }
      },
    },*/
    {
      title: i18n.t("userSetting.legal_and_privacy"),
      beforeIcon: <IconComputerHand width={20} height={20} />,
      icon: <IconMore width={16} height={16} />,
      navigationTo: () =>
        navigation.navigate(RouterName.WEBVIEW, {
          url: URL_CONFIG.PRIVACY_POLICY_URL[i18n.locale as 'zh' | 'en'],
          title: i18n.t("signIn.privacyPolicy"),
        }),
    },
    {
      title: i18n.t("userSetting.help_center"),
      beforeIcon: <IconMessage width={20} height={20} />,
      icon: <IconMore width={16} height={16} />,
      navigationTo: () => openBottomSheet("helperMessage"),
    },
    {
      title: i18n.t("userSetting.logout"),
      beforeIcon: <IconLogout width={20} height={20} />,
      icon: <IconMore width={16} height={16} />,
      navigationTo: deleteAccount,
    },
  ];

  useEffect(() => {
    async function fetchUserInfo() {
      const res = await UserStorage.getUserInfo();
      setUserInfoData(res);
    }
    fetchUserInfo();
  }, []);

  // 获取当前版本号
  useEffect(() => {
    const getVersion = async () => {
      try {
        const version = await DeviceInfo.getVersion();
        if(version === "unknown" || !version) {
          setAppVersion("1.0.0");
        } else {
          setAppVersion(version);
        }
        console.log("version 😭 ", version);
      } catch (error) {
        console.error("获取版本号失败:", error);
      }
    };
    getVersion();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <SafeAreaView style={styles.containerBox}>
        {/* 返回按钮 */}
        <AppBar title={i18n.t("settings.title")}></AppBar>
        {/* 设置项 */}
          {settingsData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.listItem}
              onPress={item.navigationTo}
            >
              <View style={styles.listItemLabel}>
                {item.beforeIcon}
                <Text style={styles.listItemText}>{item.title}</Text>
              </View>
              <TouchableOpacity onPress={item.navigationTo}>
                {item.icon}
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

        {/* 退出登录按钮 */}
        <Button
          type={"primary"}
          style={styles.logoutButton}
          textStyle={styles.logoutTextColor}
          onPress={handleSignOut}
          loading={isLoggingOut}
          loadingColor={Theme.primary}
        >
          {i18n.t("userSetting.log_out")}
        </Button>

        {/* 版本号 */}
        <TouchableOpacity onPress={handleVersionPress}>
          <Text style={styles.version}>
            {i18n.t("userSetting.version_number")}v
            {appVersion || "1.0.0"}
          </Text>
        </TouchableOpacity>

        <InfoModal
          isVisible={infoModalVisible}
          title={infoModalTitle}
          content={infoModalContent} // 传入内容
          type={infoModalMessage[infoModalMessageType].type}
          onConfirm={() => {
            console.log("InfoModal", infoModalMessageType);
            if (infoModalMessageType === "accountDeletionWarning") {
              destroyAccount();
              return;
            }
          }}
          onClose={() => {
            closeAllModals();
          }}
        />
        <BottomSheet
          isVisible={messageVisible}
          onClose={() => {
            setMessageVisible(false);
          }}
          height="auto"
        >
          <View style={styles.bottomSheetContainer}>
            {infoModalMessageType === "helperMessage" && (
              <View style={styles.titleImageBox}>
                <Image
                  style={styles.titleImage}
                  source={helpCenterImage}
                  width={140}
                  height={140}
                />
              </View>
            )}
            <Text style={styles.modalTitle}>{modalMessage.title}</Text>
            <Text style={styles.modalMessage}>{modalMessage.message}</Text>
            <View style={styles.buttonBox}>
              {modalMessage.type === "confirm" && (
                <Button
                  type={"outline"}
                  style={styles.modalButton}
                  textStyle={styles.modalButtonText}
                  onPress={() => {
                    setMessageVisible(false);
                  }}
                >
                  {i18n.t("common.close")}
                </Button>
              )}
              <Button
                type={"primary"}
                style={[
                  styles.modalButton,
                  modalMessage.type === "info" ? styles.infoButton : {},
                ]}
                textStyle={styles.modalButtonText}
                onPress={() => {
                  if (["helperMessage", "insufficientBalanceWarning"].includes(infoModalMessageType)) {
                    closeAllModals();
                    return;
                  }
                  if (infoModalMessageType === "logoutConfirmation") {
                    handleSignOut();
                    return;
                  }
                  if (infoModalMessageType === "accountDeletionWarning") {
                    destroyAccount();
                    return;
                  }
                }}
              >
                {i18n.t("common.confirm")}
              </Button>
            </View>
          </View>
        </BottomSheet>
      {versionData?.version && (
        <UpdateModal
          versionData={versionData}
          onClose={handleClose}
          isVisible={isVisible}
        ></UpdateModal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerBox: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: Theme.background[50],
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    height: 54,
  },
  listItemLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  listItemText: {
    fontSize: 14,
    marginLeft: 12,
    color: Theme.text[300],
    fontWeight: "500",
    fontFamily: FontFamily.medium,
  },
  logoutButton: {
    marginVertical: '5%',
    backgroundColor: Theme.background[200],
  },
  logoutTextColor: {
    color: Theme.text[300],
  },
  version: {
    fontSize: 12,
    textAlign: "center",
    color: Theme.text[300],
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  bottomSheetContainer: {
    paddingVertical: 16,
    flexDirection: "column",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: FontFamily.semiBold,
    marginBottom: 7,
    color: "#000",
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    marginBottom: 32,
    textAlign: "center",
  },
  modalButton: {
    width: "45%",
    height: 44,
  },
  modalButtonText: {
    fontSize: 15,
  },
  buttonBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleImageBox: {
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  titleImage: {
    width: 140,
    height: 140,
    textAlign: "center",
  },
  infoButton: {
    width: "100%",
  },
});

export default SettingsScreen;
