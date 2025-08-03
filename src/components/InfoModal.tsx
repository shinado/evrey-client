import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Button } from './Button';
import { Theme } from '../constants/Theme';
import {FontFamily} from "../constants/typo";
import i18n from "../i18n";

interface InfoModalProps {
  isVisible: boolean;
  imageElement?: React.ReactNode;
  title: string;
  content: Array<{ label: string; value?: string }>; // `value` 现在是可选的
  onClose: () => void;
  onConfirm: () => void;
  type: 'info' | 'confirm' | string;
}

const InfoModal: React.FC<InfoModalProps> = ({
                                               isVisible,
                                               imageElement,
                                               title,
                                               content,
                                               onClose,
                                               onConfirm,
                                               type,
                                             }) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose} // 点击背景关闭弹窗
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropColor="rgba(0, 0, 0, 0.5)"
      backdropOpacity={0.7}
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        {imageElement}
        <View style={[styles.titleBox, imageElement ? {borderBottomColor: 'white'} : {}]}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* 动态显示内容 */}
        {/*<View style={styles.contentBox}>
          {content.map((item, index) => (
            <View key={index} style={[styles.contentRow, !item.value ? styles.centeredContent : {}]}>
              <Text style={[styles.label, !item.value ? styles.fullWidthText : {}, !item.value && content.length > 1 ? styles.descText : {}]}>
                {item.label}
              </Text>
              {item.value && <Text style={styles.value}>{item.value}</Text>}
            </View>
          ))}
        </View>*/}
        <View style={styles.contentBox}>
          {content.map((item, index) => {
            const isNextItemDesc = content[index + 1] && !content[index + 1].value; // 下一个是说明文字
            const isPrevItemValue = index > 0 && content[index - 1].value; // 前一个是 value 说明防止重复渲染

            return (
              <View key={`item-${index}`}>
                {/* 1️⃣ 只渲染 label+value（无额外说明） */}
                {item.value && !isNextItemDesc && (
                  <View style={styles.contentRow}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.value}>{item.value}</Text>
                  </View>
                )}

                {/* 2️⃣ 既有 label+value，又有 label 作为说明 */}
                {item.value && isNextItemDesc && (
                  <View>
                    <View style={[styles.contentRow, styles.contentRowHasDesc]}>
                      <Text style={[styles.label, styles.hasDesc]}>{item.label}</Text>
                      <Text style={styles.value}>{item.value}</Text>
                    </View>
                    <View style={[styles.contentRow, styles.centeredContent, styles.listHasDesc]}>
                      <Text style={[styles.label, styles.fullWidthText, styles.descText]}>
                        {content[index + 1].label}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 3️⃣ 说明文字单独显示（只有 label，没有 value） */}
                {!item.value && !isPrevItemValue && (
                  <View style={[styles.contentRow, styles.centeredContent]}>
                    <Text style={[styles.label, styles.descText, styles.fullWidthText]}>
                      {item.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 按钮 */}
        <View style={[styles.infoBtnBox, type === 'confirm' ? { justifyContent: 'space-between' } : { justifyContent: 'center' }]}>
          {type === 'confirm' && (
            <Button onPress={onClose} type="outline"
                    style={[styles.modalButton, styles.confirmButton]}
                    textStyle={styles.buttonText}
            >
              {i18n.t("common.close")}
            </Button>
          )}
          <Button onPress={onConfirm} type="primary" style={[styles.modalButton, type === 'confirm' ? styles.confirmButton : styles.infoButton]}>
            {i18n.t("common.confirm")}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0, // 去掉默认边距
    width: '100%',
  },
  modalContent: {
    backgroundColor: Theme.background["50"],
    // padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  titleBox: {
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E4E8',
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
  },
  contentBox: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contentRowHasDesc: {
    marginBottom: 4,
  },
  centeredContent: {
    width: "100%",
    justifyContent: 'center', // 仅 `label` 时，居中对齐
  },
  listHasDesc: {
    marginBottom: 18
  },
  onlyValue: {
    fontSize: 12,
    color: Theme.text['200'],
    fontFamily: FontFamily.regular,
    flex: 1,
    textAlign: 'center',
  },
  label: {
    color: Theme.text[100], // #717277 (主要内容)
    fontFamily: FontFamily.medium, // 500 对应 Manrope-Medium
    fontWeight: "500", // 仍然保留 fontWeight
    fontSize: 14,
    fontStyle: "normal",
    lineHeight: 20,
  },
  value: {
    color: Theme.text[300], // #000000 (主文字)
    textAlign: "right",
    fontFamily: FontFamily.semiBold, // 600 对应 Manrope-SemiBold
    fontWeight: "600", // 仍然保留 fontWeight
    fontSize: 15,
    fontStyle: "normal",
    lineHeight: 20, // "normal" 无具体数值，React Native 可不设置
    width: '40%',
  },
  hasDesc: {
    color: Theme.text[300], // #000000 (主文字)
  },
  modalButton: {
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 16,
    height: 40,
    fontSize: 14,
    fontWeight: '400',
  },
  confirmButton: {
    width: "45%",
  },
  infoButton: {
    width: '50%',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    fontWeight: '400'
  },
  infoBtnBox: {
    width: '100%',
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  fullWidthText: {
    textAlign: 'center', // 仅 `label` 时，文字居中
    // flex: 1,
    width: '100%',
  },
  descText: {
    color: Theme.text[100], // #717277 (主要内容)
    fontFamily: FontFamily.regular, // 400 对应 Manrope-Regular
    fontWeight: "400", // 仍然保留 fontWeight
    fontSize: 12,
    fontStyle: "normal",
    lineHeight: 15,
    textAlign: 'left',
  },
});

export default InfoModal;