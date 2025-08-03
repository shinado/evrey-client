import React, { useRef, useState } from "react";
import {View, Text, Image, TouchableOpacity, Alert, StyleSheet, Dimensions, ImageBackground} from "react-native";
import ViewShot from "react-native-view-shot";
import Modal from "react-native-modal";
import * as MediaLibrary from "expo-media-library";
import { QrCodeSvg } from 'react-native-qr-svg';
import * as Clipboard from "expo-clipboard";
import CloseIcon from "../../../assets/common/close_w.svg"
import i18n from "../../i18n";
import { FontFamily } from "../../constants/typo";
import {Theme} from "../../constants/Theme";
import IconCopy from "../../../assets/rebate/icon_copy.svg";
import {Button} from "../Button";
const shareBg = require("../../../assets/rebate/share_bg.png");
const shareBg2 = require("../../../assets/rebate/share_bg_2.png");
const shareTitleBg = require("../../../assets/rebate/share_title_bg.png");
import Toast from "react-native-toast-message";
import { AddressFormatUtil } from "../../utils/format";
export interface RebateShareData {
  inviteCode: string;
  inviteLink: string;
  userName: string;
  userAvatar: any;
  bgType: number
}


const { height, width } = Dimensions.get("window");

const RebateShareModal = ({ visible, onClose, data ,storeTitle}: { visible: boolean, onClose: () => void, data: RebateShareData ,storeTitle? : string}) => {
  const viewShotRef = useRef<any>(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // 请求相册权限
  const requestStoragePermission = async (): Promise<boolean> => {
    if (!permissionResponse || permissionResponse.status !== "granted") {
      const response = await requestPermission();
      if (response.status !== "granted") {
        Alert.alert("权限请求", "请允许访问相册以保存图片");
        return false;
      }
    }
    return true;
  };

  // 截图并保存到相册
  const captureAndSave = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    try {
      const uri = await viewShotRef.current?.capture();
      if (!uri) throw new Error("截图失败");

      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("MyApp", asset, false);
      Alert.alert("保存成功", "图片已保存到相册");
      onClose();
    } catch (error) {
      console.error("保存失败:", error);
      Alert.alert("保存失败", "无法保存图片，请重试");
    }
  };

  const handleCopy = async (text: string) => {
    console.log('text', text);
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: 'success',
      text1: i18n.t("common.copy_success"),
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

 
  const conformityUrl = `${data.inviteLink}?ref=${data.inviteCode}`;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose} // 下滑关闭
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modalContainer} // 让弹窗贴底部
    >
      {/* 底部弹出的海报内容 */}
      <View style={styles.modalContent}>
        <View style={styles.content}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 29 ,width: 311}}>
              <View style={{ width: 24, height: 24 }}></View>
              <Text style={styles.storeTitle}>{storeTitle ?? i18n.t("rebate.rebate_share")}</Text>
              <TouchableOpacity onPress={onClose}>
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
          <View style={styles.bodyContent}>
            <ViewShot style={styles.viewShot} ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
              <View style={styles.posterContainer}>
                <View style={styles.topInfoBox}>
                  <View style={styles.headerBox}>
                    <ImageBackground source={data.bgType === 1 ? shareBg : shareBg2} style={styles.headerBackground}>
                      <View style={styles.headerTextContent}>
                        <View style={styles.headerTextBox}>
                          <ImageBackground source={shareTitleBg} style={styles.headerTextBg} >
                            <Text style={styles.headerTextTitle}>{i18n.t("rebate.share.referral_code")}</Text>
                            <Text style={styles.headerText}>{data.inviteCode}</Text>
                          </ImageBackground>
                        </View>
                      </View>
                      <View style={styles.headerContent}>
                        <View style={styles.headerUserInfo}>
                          <View style={styles.headerImageBox}>
                            {
                              data.userAvatar &&
                              <Image style={styles.userAvatar} resizeMode={'contain'} source={{uri: data.userAvatar}} />
                            }
                          </View>
                          <Text style={styles.userName}>{data.userName}</Text>
                          <Text style={styles.infoText}>{i18n.t("rebate.share.invite_desc")}</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </View>
                  <View style={styles.shareBodyContent}>
                    <View style={styles.bodyLeftContent}>
                      <Text style={styles.leftTitle}>{i18n.t("rebate.share.info_1")}</Text>
                      <Text style={styles.leftInfo}>{i18n.t("rebate.share.info_2")}</Text>
                      <Text style={styles.leftInfo}>{i18n.t("rebate.share.info_3")}</Text>
                    </View>
                    <View style={styles.bodyRightContent}>
                      <View style={styles.qrCodeBox}>
                        <QrCodeSvg
                          value={conformityUrl}
                          frameSize={60}
                          contentCells={5}
                          errorCorrectionLevel="H"
                          dotColor="black"
                          backgroundColor="white"
                        />
                      </View>
                      <Text style={styles.qrCodeDesc}>{i18n.t("rebate.share.scan_code")}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ViewShot>
            <View style={styles.bottomContent}>
              <View style={styles.bottomItem}>
                <Text style={styles.label}>{i18n.t("rebate.share.my_referral_code")}</Text>
                <View style={styles.valueBox}>
                  <Text style={styles.value}>{data.inviteCode}</Text>
                  <TouchableOpacity onPress={() => handleCopy(data.inviteCode)}>
                    <IconCopy width={16} height={16} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.bottomItem, {marginTop: 12}]}>
               <Text style={styles.label}>{i18n.t("rebate.share.my_referral_link")}</Text>
               <View style={styles.valueBox}>
                 <Text style={styles.value}>{AddressFormatUtil.formatAddressShort(conformityUrl)}</Text>
                 <TouchableOpacity onPress={() => handleCopy(conformityUrl)}>
                   <IconCopy width={16} height={16} />
                 </TouchableOpacity>
               </View>
              </View>
            </View>
            <View style={styles.buttonBox}>
              <Button type={'primary'} style={styles.saveButton} onPress={() => {captureAndSave()}}>{i18n.t("common.save")}</Button>
            </View>
          </View>
        </View>
        {/*<View style={styles.button}>
          <TouchableOpacity onPress={onCopylink} style={{ ...styles.saveButton, marginRight: 79 }}>
            <View style={{ ...styles.button_view, backgroundColor: '#272A2D' }}>
              <CopylinkIcon style={styles.button_view_icon} />
            </View>
            <Text style={styles.buttonText}>{i18n.t("video.clone_link")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={captureAndSave} style={styles.saveButton}>
            <View style={{ ...styles.button_view, backgroundColor: '#7448F7' }}>
              <SaveImageIcon style={styles.button_view_icon} />
            </View>
            <Text style={styles.buttonText}>{i18n.t("video.save_img")}</Text>
          </TouchableOpacity>
        </View>*/}
      </View>
      <Toast />
    </Modal>
  );
};

export default RebateShareModal;

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: "flex-end", // 让弹窗贴底部
    margin: 0, // 确保 Modal 贴合屏幕
  },
  modalContent: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    width: width,
    height: height,
    alignItems: "center",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  bodyContent: {
    backgroundColor: "#f6f7f9",
    borderRadius: 16,
    paddingBottom: 19
  },
  posterContainer: {
    width: 311,
    // padding: 12,

  },
  topInfoBox: {
    padding: 12,
    paddingBottom: 14,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  headerBox: {
    width: '100%',
    flexDirection: "row",
    height: 287,
  },
  headerBackground: {
    width: "100%",
    height: 287,
  },
  headerTextContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBox: {
    width: 148,
    height: 48,
    marginTop: -13
  },
  headerTextBg: {
    width: 148,
    height: 48,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    resizeMode: 'contain',
  },
  headerTextTitle: {
    color: 'rgba(0, 0, 0, 0.70)',
    fontFamily: FontFamily.regular,
    fontSize: 12,
    fontWeight: "400",
  },
  headerText: {
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  headerUserInfo: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: 'center'
  },
  headerImageBox: {
    width: 72,
    height: 72,
    borderWidth: 4.5,
    borderColor: '#FFF',
    borderRadius: 38,
  },
  userAvatar: {
    width: 63,
    height: 63,
    borderRadius: 63
  },
  userName: {
    color: Theme.background[50], // #FFF (白色)
    textAlign: "center",
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    fontFamily: FontFamily.semiBold, // 600 对应 Manrope-SemiBold
    fontWeight: "600", // 仍然保留 fontWeight
    fontSize: 15,
    fontStyle: "normal",
    lineHeight: 22, // 146.667%
    marginTop: 8,
  },
  infoText: {
    color: Theme.background[50], // #FFF (白色)
    textAlign: "center",
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    fontFamily: FontFamily.regular, // 400 对应 Manrope-Regular
    fontWeight: "400", // 仍然保留 fontWeight
    fontSize: 10,
    fontStyle: "normal",
    lineHeight: 18, // 180%
    backgroundColor: Theme.text[300],
    paddingHorizontal: 6,
  },
  shareBodyContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bodyLeftContent: {
    width: 170,
    flexDirection: "column",
  },
  leftTitle: {
    color: "rgba(0, 0, 0, 0.90)", // 透明度 90% 的黑色
    fontFamily: FontFamily.semiBold, // 600 对应 Manrope-SemiBold
    fontWeight: "600", // 仍然保留 fontWeight
    fontSize: 12.372,
    fontStyle: "normal",
    lineHeight: 19.442,
    marginTop: 8,
  },
  leftInfo: {
    color: "rgba(0, 0, 0, 0.70)", // 透明度 70% 的黑色
    fontFamily: FontFamily.regular, // 400 对应 Manrope-Regular
    fontWeight: "400", // 仍然保留 fontWeight
    fontSize: 12.372,
    fontStyle: "normal",
    lineHeight: 19.442,
    marginTop: 4
  },
  bodyRightContent: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: -18,
    marginLeft: 13,
  },
  qrCodeBox: {
    width: 76,
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.background[50],
  },
  qrCodeDesc: {
    color: "rgba(0, 0, 0, 0.50)", // 透明度 50% 的黑色
    fontFamily: FontFamily.regular, // 400 对应 Manrope-Regular
    fontWeight: "400", // 仍然保留 fontWeight
    fontSize: 10,
    fontStyle: "normal",
    lineHeight: 18, // 180%
  },
  bottomContent: {
    flexDirection: "column",
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  bottomItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "rgba(0, 0, 0, 0.50)", // 透明度 50% 的黑色
    fontFamily: FontFamily.regular, // 400 对应 Manrope-Regular
    fontWeight: "400", // 仍然保留 fontWeight
    fontSize: 14,
    fontStyle: "normal",
    lineHeight: 22, // 157.143%
  },
  valueBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: Theme.text[300], // #000000 (主文字)
    textAlign: "right",
    fontFamily: FontFamily.semiBold, // 600 对应 Manrope-SemiBold
    fontWeight: "600", // 仍然保留 fontWeight
    fontSize: 14,
    fontStyle: "normal",
    lineHeight: 22, // 157.143%
    marginRight: 3
  },
  buttonBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    textAlign: "center",
    width: 132,
    height: 40,
  },
  viewShot: {
    // backgroundColor: '#FAFCFE',
    width: 311,
    // borderRadius: 16,
  },

  storeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  }
});


