import React from "react";
import { View, Text, StyleSheet, Linking, Image } from "react-native";
import { Button } from "./Button";
import { Theme } from "../constants/Theme";
import Modal from "react-native-modal";
import { VersionData } from "../services/config/versions";
import i18n from "../i18n";

interface UpdateModalProps {
  isVisible: boolean;
  onClose: () => void;
  versionData: VersionData;
}

const UpdateModal = ({ isVisible, onClose, versionData }: UpdateModalProps) => {
  const AppUpdatePng = require("../../assets/common/update.png");
  
  const handleUpdate = () => {
    // 优先使用 apkUrl，如果没有则使用 downloadUrl
    const downloadUrl = versionData.apkUrl
    if (downloadUrl) {
      Linking.openURL(downloadUrl);
    }
  };

  // 判断是否为强制更新（根据版本号比较）
  const isForceUpdate = versionData.versionMin && 
    versionData.versionMin > versionData.version;

  return (
    <Modal
      onBackButtonPress={() => {}} // Android 返回键无效
      isVisible={isVisible}
      style={styles.containerModal}
      onBackdropPress={isForceUpdate ? () => {} : onClose}
    >
      <View style={styles.container}>
        <Image source={AppUpdatePng} style={styles.appUpdatePng} />
        <Text style={styles.title}>{i18n.t("common.updateTitle")}</Text>
        <Text style={styles.version}>V{versionData.versionStr}</Text>
        {versionData.description && (
          <Text style={styles.description}>{versionData.description}</Text>
        )}

        <View style={styles.buttonContainer}>
          {!isForceUpdate && (
            <Button
              style={[
                styles.button,
                {
                  backgroundColor: Theme.secondaryColors[100],
                  marginBottom: 10,
                },
              ]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>
                {i18n.t("common.updateLater")}
              </Text>
            </Button>
          )}
          <Button style={styles.button} onPress={handleUpdate}>
            <Text style={[styles.buttonText, { color: "white" }]}>
              {i18n.t("common.updateNow")}
            </Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 311,
    height: "auto",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingBottom: 20,
  },
  containerModal: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
    color: "#000000",
  },
  version: {
    fontSize: 12,
    color: "#4C4D50",
    marginBottom: 14,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#4C4D50",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: 132,
    height: 41,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  buttonText: {
    fontWeight: "500",
    fontSize: 14,
    color: "#FFFFFF",
  },
  appUpdatePng: {
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    width: "100%",
    height: 190,
    marginBottom: 12,
  },
});

export default UpdateModal;
